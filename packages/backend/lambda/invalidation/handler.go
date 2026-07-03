package main

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cloudfront"
	cftypes "github.com/aws/aws-sdk-go-v2/service/cloudfront/types"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

// DynamoDBStreamEvent is the event shape forwarded by EventBridge Pipe.
// Each record contains the DynamoDB stream record.
type DynamoDBStreamEvent struct {
	Records []DynamoDBRecord `json:"records"`
}

type DynamoDBRecord struct {
	EventName string         `json:"eventName"`
	DynamoDB  DynamoDBChange `json:"dynamodb"`
}

type DynamoDBChange struct {
	NewImage map[string]AttributeValue `json:"NewImage"`
	OldImage map[string]AttributeValue `json:"OldImage"`
}

type AttributeValue struct {
	S    string `json:"S"`
	BOOL bool   `json:"BOOL"`
}

// handler processes DynamoDB Stream records forwarded by the EventBridge Pipe.
// The pipe filter ensures only PROJECT# records reach this handler.
func handler(ctx context.Context, event []map[string]interface{}) error {
	if len(event) == 0 {
		return nil
	}

	// Collect unique project IDs from the batch.
	projectIds := extractProjectIds(event)
	if len(projectIds) == 0 {
		return nil
	}

	// Build invalidation paths: the projects list + each individual project.
	paths := []string{"/api/projects"}
	for _, id := range projectIds {
		paths = append(paths, fmt.Sprintf("/api/projects/%s", id))
	}

	// 1. Create CloudFront invalidation.
	callerRef := fmt.Sprintf("inv-%d", time.Now().UnixNano())
	createResult, err := cfClient.CreateInvalidation(ctx, &cloudfront.CreateInvalidationInput{
		DistributionId: aws.String(distributionId),
		InvalidationBatch: &cftypes.InvalidationBatch{
			CallerReference: aws.String(callerRef),
			Paths: &cftypes.Paths{
				Quantity: aws.Int32(int32(len(paths))),
				Items:    paths,
			},
		},
	})
	if err != nil {
		return fmt.Errorf("create invalidation failed: %w", err)
	}

	invalidationId := aws.ToString(createResult.Invalidation.Id)

	// 2. Poll until invalidation completes (~5-30s typically).
	if err := waitForInvalidation(ctx, invalidationId); err != nil {
		return fmt.Errorf("wait for invalidation failed: %w", err)
	}

	// 3. Warm cache by fetching affected endpoints via CloudFront.
	warmCache(paths)

	// 4. Write lastPublished timestamp to META record.
	if err := writeLastPublished(ctx); err != nil {
		return fmt.Errorf("write lastPublished failed: %w", err)
	}

	return nil
}

// extractProjectIds pulls unique project IDs from the pipe event batch.
// EventBridge Pipe forwards DynamoDB stream records as an array of maps.
func extractProjectIds(event []map[string]interface{}) []string {
	seen := map[string]bool{}
	var ids []string

	for _, record := range event {
		dynamodbData, ok := record["dynamodb"].(map[string]interface{})
		if !ok {
			continue
		}
		// Try NewImage first, fall back to OldImage (for deletes).
		var pk string
		if newImage, ok := dynamodbData["NewImage"].(map[string]interface{}); ok {
			pk = extractPK(newImage)
		}
		if pk == "" {
			if oldImage, ok := dynamodbData["OldImage"].(map[string]interface{}); ok {
				pk = extractPK(oldImage)
			}
		}
		if pk == "" {
			continue
		}

		// PK format: "PROJECT#<uuid>"
		parts := strings.SplitN(pk, "#", 2)
		if len(parts) == 2 && parts[0] == "PROJECT" && !seen[parts[1]] {
			seen[parts[1]] = true
			ids = append(ids, parts[1])
		}
	}
	return ids
}

// extractPK gets the PK string value from a DynamoDB image map.
func extractPK(image map[string]interface{}) string {
	pkAttr, ok := image["PK"].(map[string]interface{})
	if !ok {
		return ""
	}
	s, _ := pkAttr["S"].(string)
	return s
}

// waitForInvalidation polls CloudFront until the invalidation completes.
func waitForInvalidation(ctx context.Context, invalidationId string) error {
	for i := 0; i < 30; i++ {
		result, err := cfClient.GetInvalidation(ctx, &cloudfront.GetInvalidationInput{
			DistributionId: aws.String(distributionId),
			Id:             aws.String(invalidationId),
		})
		if err != nil {
			return err
		}
		if aws.ToString(result.Invalidation.Status) == "Completed" {
			return nil
		}
		time.Sleep(2 * time.Second)
	}
	return fmt.Errorf("invalidation %s did not complete within 60s", invalidationId)
}

// warmCache fetches each path via the CloudFront domain to populate the cache.
// Uses plain GET with no custom headers (CloudFront uses headers as cache key).
func warmCache(paths []string) {
	client := &http.Client{Timeout: 10 * time.Second}
	for _, p := range paths {
		url := fmt.Sprintf("https://%s%s", domainName, p)
		resp, err := client.Get(url)
		if err == nil {
			resp.Body.Close()
		}
	}
}

// writeLastPublished writes a timestamp to the META record in DynamoDB.
// The dashboard reads this to show a "last published" indicator.
func writeLastPublished(ctx context.Context) error {
	now := time.Now().UTC().Format(time.RFC3339)
	_, err := dbClient.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item: map[string]types.AttributeValue{
			"PK":            &types.AttributeValueMemberS{Value: "META"},
			"SK":            &types.AttributeValueMemberS{Value: "lastPublished"},
			"lastPublished": &types.AttributeValueMemberS{Value: now},
		},
	})
	return err
}

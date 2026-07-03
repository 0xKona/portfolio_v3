package main

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	dbtypes "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	s3types "github.com/aws/aws-sdk-go-v2/service/s3/types"
)

type CleanupResult struct {
	Scanned  int `json:"scanned"`
	Orphaned int `json:"orphaned"`
	Deleted  int `json:"deleted"`
}

func handler(ctx context.Context) (CleanupResult, error) {
	result := CleanupResult{}

	// 1. List all objects under processed/ and extract unique projectIds.
	projectObjects, err := listProcessedObjects(ctx)
	if err != nil {
		return result, fmt.Errorf("list processed objects: %w", err)
	}

	// Group objects by projectId.
	grouped := groupByProject(projectObjects)
	result.Scanned = len(grouped)

	if result.Scanned == 0 {
		return result, nil
	}

	// 2. Check each projectId against DynamoDB and collect orphans.
	cutoff := time.Now().Add(-24 * time.Hour)
	var toDelete []s3types.ObjectIdentifier

	for projectId, objects := range grouped {
		exists, err := projectExists(ctx, projectId)
		if err != nil {
			return result, fmt.Errorf("check project %s: %w", projectId, err)
		}
		if exists {
			continue
		}

		// Only delete if all objects are older than 1 day.
		allOld := true
		for _, obj := range objects {
			if obj.LastModified != nil && obj.LastModified.After(cutoff) {
				allOld = false
				break
			}
		}
		if !allOld {
			continue
		}

		result.Orphaned++
		for _, obj := range objects {
			toDelete = append(toDelete, s3types.ObjectIdentifier{
				Key: obj.Key,
			})
		}
	}

	// 3. Batch delete orphaned objects (max 1000 per call).
	for i := 0; i < len(toDelete); i += 1000 {
		end := i + 1000
		if end > len(toDelete) {
			end = len(toDelete)
		}
		batch := toDelete[i:end]

		_, err := s3Client.DeleteObjects(ctx, &s3.DeleteObjectsInput{
			Bucket: aws.String(bucketName),
			Delete: &s3types.Delete{
				Objects: batch,
				Quiet:   aws.Bool(true),
			},
		})
		if err != nil {
			return result, fmt.Errorf("delete batch at offset %d: %w", i, err)
		}
		result.Deleted += len(batch)
	}

	return result, nil
}

type objectInfo struct {
	Key          *string
	LastModified *time.Time
}

func listProcessedObjects(ctx context.Context) ([]objectInfo, error) {
	var objects []objectInfo
	prefix := "processed/"
	paginator := s3.NewListObjectsV2Paginator(s3Client, &s3.ListObjectsV2Input{
		Bucket: aws.String(bucketName),
		Prefix: aws.String(prefix),
	})

	for paginator.HasMorePages() {
		page, err := paginator.NextPage(ctx)
		if err != nil {
			return nil, err
		}
		for _, obj := range page.Contents {
			objects = append(objects, objectInfo{
				Key:          obj.Key,
				LastModified: obj.LastModified,
			})
		}
	}
	return objects, nil
}

func groupByProject(objects []objectInfo) map[string][]objectInfo {
	groups := make(map[string][]objectInfo)
	for _, obj := range objects {
		key := aws.ToString(obj.Key)
		// Key format: processed/<projectId>/thumbnail.jpg
		parts := strings.SplitN(strings.TrimPrefix(key, "processed/"), "/", 2)
		if len(parts) < 2 {
			continue
		}
		projectId := parts[0]
		groups[projectId] = append(groups[projectId], obj)
	}
	return groups
}

func projectExists(ctx context.Context, projectId string) (bool, error) {
	pk := "PROJECT#" + projectId
	result, err := dbClient.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(tableName),
		Key: map[string]dbtypes.AttributeValue{
			"PK": &dbtypes.AttributeValueMemberS{Value: pk},
			"SK": &dbtypes.AttributeValueMemberS{Value: pk},
		},
		ProjectionExpression: aws.String("PK"),
	})
	if err != nil {
		return false, err
	}
	return result.Item != nil, nil
}

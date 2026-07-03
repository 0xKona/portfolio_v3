package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var (
	uuidRegex = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)
	allowedExts = map[string]bool{"jpg": true, "jpeg": true, "png": true, "webp": true, "gif": true}
)

type UploadUrlRequest struct {
	ProjectID     string `json:"projectId"`
	FileExtension string `json:"fileExtension"`
}

func handleCreate(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var req UploadUrlRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return jsonResponse(400, map[string]string{"message": "invalid JSON body"})
	}

	if errs := validateUploadRequest(req); len(errs) > 0 {
		return jsonResponse(400, map[string]interface{}{"message": "validation failed", "errors": errs})
	}

	// Set imageProcessed=false on the project record. This resets state for
	// re-uploads — the dashboard polls this flag until processing completes.
	_, err := dbClient.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(tableName),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: fmt.Sprintf("PROJECT#%s", req.ProjectID)},
			"SK": &types.AttributeValueMemberS{Value: fmt.Sprintf("PROJECT#%s", req.ProjectID)},
		},
		UpdateExpression:         aws.String("SET #ip = :false"),
		ExpressionAttributeNames: map[string]string{"#ip": "imageProcessed"},
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":false": &types.AttributeValueMemberBOOL{Value: false},
		},
		ConditionExpression: aws.String("attribute_exists(PK)"),
	})
	if err != nil {
		var ccf *types.ConditionalCheckFailedException
		if errors.As(err, &ccf) {
			return jsonResponse(404, map[string]string{"message": "project not found"})
		}
		return jsonResponse(500, map[string]string{"message": fmt.Sprintf("dynamodb error: %v", err)})
	}

	// Generate a presigned S3 PUT URL for the raw upload location.
	// The client uploads directly to S3 using this URL (no Lambda in the upload path).
	key := fmt.Sprintf("raw/%s/original.%s", req.ProjectID, req.FileExtension)

	presignClient := s3.NewPresignClient(s3Client)
	presignResult, err := presignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
	}, s3.WithPresignExpires(5*time.Minute))
	if err != nil {
		return jsonResponse(500, map[string]string{"message": fmt.Sprintf("failed to generate presigned url: %v", err)})
	}

	return jsonResponse(200, map[string]interface{}{
		"uploadUrl": presignResult.URL,
		"projectId": req.ProjectID,
		"key":       key,
	})
}

func validateUploadRequest(req UploadUrlRequest) []string {
	var errs []string
	if req.ProjectID == "" {
		errs = append(errs, "projectId is required")
	} else if !uuidRegex.MatchString(req.ProjectID) {
		errs = append(errs, "projectId must be a valid UUID")
	}
	if req.FileExtension == "" {
		errs = append(errs, "fileExtension is required")
	} else if !allowedExts[req.FileExtension] {
		errs = append(errs, "fileExtension must be one of: jpg, jpeg, png, webp, gif")
	}
	return errs
}

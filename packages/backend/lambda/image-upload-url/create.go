package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"regexp"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var (
	uuidRegex   = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)
	allowedExts = map[string]bool{"jpg": true, "jpeg": true, "png": true, "webp": true, "gif": true}
)

type UploadUrlRequest struct {
	ProjectID     string `json:"projectId"`
	FileExtension string `json:"fileExtension"`
}

func generateImageId() string {
	b := make([]byte, 5) // 10 hex chars
	rand.Read(b)
	return hex.EncodeToString(b)
}

func handleCreate(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var req UploadUrlRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return jsonResponse(400, map[string]string{"message": "invalid JSON body"})
	}

	if errs := validateUploadRequest(req); len(errs) > 0 {
		return jsonResponse(400, map[string]interface{}{"message": "validation failed", "errors": errs})
	}

	imageId := generateImageId()
	key := fmt.Sprintf("raw/%s/%s.%s", req.ProjectID, imageId, req.FileExtension)

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
		"imageId":   imageId,
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

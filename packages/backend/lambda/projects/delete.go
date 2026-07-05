package main

import (
	"context"
	"errors"
	"fmt"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	s3types "github.com/aws/aws-sdk-go-v2/service/s3/types"
)

func handleDelete(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	id := request.PathParameters["id"]
	if id == "" {
		return jsonResponse(400, map[string]string{"message": "missing project id in path"})
	}

	_, err := dbClient.DeleteItem(ctx, &dynamodb.DeleteItemInput{
		TableName: aws.String(tableName),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: fmt.Sprintf("PROJECT#%s", id)},
			"SK": &types.AttributeValueMemberS{Value: fmt.Sprintf("PROJECT#%s", id)},
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

	// Best-effort S3 cleanup — delete raw/<id>/ and processed/<id>/ objects.
	// Errors are logged but don't fail the response; the weekly cleanup Lambda
	// handles any stragglers.
	deletePrefix(ctx, fmt.Sprintf("raw/%s/", id))
	deletePrefix(ctx, fmt.Sprintf("processed/%s/", id))

	return jsonResponse(204, nil)
}

func deletePrefix(ctx context.Context, prefix string) {
	paginator := s3.NewListObjectsV2Paginator(s3Client, &s3.ListObjectsV2Input{
		Bucket: aws.String(bucketName),
		Prefix: aws.String(prefix),
	})

	for paginator.HasMorePages() {
		page, err := paginator.NextPage(ctx)
		if err != nil {
			log.Printf("WARN: failed to list objects under %s: %v", prefix, err)
			return
		}
		if len(page.Contents) == 0 {
			return
		}

		objects := make([]s3types.ObjectIdentifier, len(page.Contents))
		for i, obj := range page.Contents {
			objects[i] = s3types.ObjectIdentifier{Key: obj.Key}
		}

		_, err = s3Client.DeleteObjects(ctx, &s3.DeleteObjectsInput{
			Bucket: aws.String(bucketName),
			Delete: &s3types.Delete{
				Objects: objects,
				Quiet:   aws.Bool(true),
			},
		})
		if err != nil {
			log.Printf("WARN: failed to delete objects under %s: %v", prefix, err)
			return
		}
	}
}

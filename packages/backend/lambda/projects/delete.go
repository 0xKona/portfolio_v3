// DELETE /api/projects/{id} — deletes a project and its S3 assets.
// 1. Deletes the DynamoDB record (returns 404 if it doesn't exist).
// 2. Batch-deletes all S3 objects under raw/<id>/ and processed/<id>/.
//    S3 cleanup is best-effort — if it fails, orphans are caught by the
//    weekly cleanup Lambda (step 7).
package main

import (
	"context"
	"errors"
	"fmt"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

func handleDelete(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Extract project ID from path parameters.
	id := request.PathParameters["id"]
	if id == "" {
		return jsonResponse(400, map[string]string{"message": "missing project id in path"})
	}

	// Delete the DynamoDB record. Condition ensures the item exists.
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

	// TODO (step 4.3): S3 cleanup — delete raw/<id>/ and processed/<id>/ objects.
	// For now, orphaned S3 objects will be caught by the weekly cleanup Lambda.

	return jsonResponse(204, nil)
}

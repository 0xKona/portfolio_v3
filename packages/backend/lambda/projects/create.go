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
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

// uuidRegex validates that the client-provided ID is a proper UUID v4 format.
var uuidRegex = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)

// CreateProjectRequest is the expected JSON body for POST /api/projects.
type CreateProjectRequest struct {
	ID        string   `json:"id"`
	Name      string   `json:"name"`
	Desc      *string  `json:"desc"`
	Skills    []string `json:"skills"`
	GithubUrl *string  `json:"githubUrl"`
	DemoUrl   *string  `json:"demoUrl"`
}

// ProjectItem represents the DynamoDB item structure for a project.
// PK/SK follow the single-table pattern: "PROJECT#<id>".
// GSI1 enables listing all projects by createdAt.
type ProjectItem struct {
	PK         string   `dynamodbav:"PK"`
	SK         string   `dynamodbav:"SK"`
	GSI1PK     string   `dynamodbav:"GSI1PK"`
	GSI1SK     string   `dynamodbav:"GSI1SK"`
	ID         string   `dynamodbav:"id"`
	Name       string   `dynamodbav:"name"`
	Desc       *string  `dynamodbav:"desc,omitempty"`
	Skills     []string `dynamodbav:"skills"`
	GithubUrl  *string  `dynamodbav:"githubUrl,omitempty"`
	DemoUrl    *string  `dynamodbav:"demoUrl,omitempty"`
	IsFeatured bool     `dynamodbav:"isFeatured"`
	Status     string   `dynamodbav:"status"`
	Images     []string `dynamodbav:"images"`
	CreatedAt  string   `dynamodbav:"createdAt"`
	UpdatedAt  string   `dynamodbav:"updatedAt"`
}

func handleCreate(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Parse the JSON request body.
	var req CreateProjectRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return jsonResponse(400, map[string]string{"message": "invalid JSON body"})
	}

	// Validate required fields and formats.
	if errs := validateCreate(req); len(errs) > 0 {
		return jsonResponse(400, map[string]interface{}{"message": "validation failed", "errors": errs})
	}

	// Build the DynamoDB item. New projects start as drafts, not featured.
	now := time.Now().UTC().Format(time.RFC3339)
	item := ProjectItem{
		PK:         fmt.Sprintf("PROJECT#%s", req.ID),
		SK:         fmt.Sprintf("PROJECT#%s", req.ID),
		GSI1PK:     "PROJECT",
		GSI1SK:     now,
		ID:         req.ID,
		Name:       req.Name,
		Desc:       req.Desc,
		Skills:     req.Skills,
		GithubUrl:  req.GithubUrl,
		DemoUrl:    req.DemoUrl,
		IsFeatured: false,
		Status:     "draft",
		Images:     []string{},
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	// Marshal the struct into a DynamoDB attribute value map.
	av, err := attributevalue.MarshalMap(item)
	if err != nil {
		return jsonResponse(500, map[string]string{"message": "failed to marshal item"})
	}

	// Write to DynamoDB. The condition expression ensures we don't overwrite
	// an existing project — if the PK already exists, DynamoDB rejects the write.
	_, err = dbClient.PutItem(ctx, &dynamodb.PutItemInput{
		TableName:           aws.String(tableName),
		Item:                av,
		ConditionExpression: aws.String("attribute_not_exists(PK)"),
	})
	if err != nil {
		// ConditionalCheckFailedException means a project with this ID already exists.
		var ccf *types.ConditionalCheckFailedException
		if errors.As(err, &ccf) {
			return jsonResponse(409, map[string]string{"message": "project with this ID already exists"})
		}
		return jsonResponse(500, map[string]string{"message": fmt.Sprintf("dynamodb error: %v", err)})
	}

	// Return the created project.
	return jsonResponse(201, map[string]interface{}{
		"id":         item.ID,
		"name":       item.Name,
		"desc":       item.Desc,
		"skills":     item.Skills,
		"githubUrl":  item.GithubUrl,
		"demoUrl":    item.DemoUrl,
		"isFeatured": item.IsFeatured,
		"status":     item.Status,
		"images":     item.Images,
		"createdAt":  item.CreatedAt,
		"updatedAt":  item.UpdatedAt,
	})
}

// validateCreate checks that all required fields are present and correctly formatted.
func validateCreate(req CreateProjectRequest) []string {
	var errs []string
	if req.ID == "" {
		errs = append(errs, "id is required")
	} else if !uuidRegex.MatchString(req.ID) {
		errs = append(errs, "id must be a valid UUID")
	}
	if req.Name == "" {
		errs = append(errs, "name is required")
	}
	if len(req.Skills) == 0 {
		errs = append(errs, "skills must be a non-empty array")
	}
	return errs
}

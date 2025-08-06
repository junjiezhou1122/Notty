# Notty Backend Design Plan 🔧

_Building a Robust Note API with Data-Driven Architecture_

## 🎯 Core Philosophy: Data-First, Layer-Driven Design

Following "How to Design Programs" principles applied to backend systems: define data structures first, build pure transformation functions, maintain clear separation of concerns through architectural layers.

---

## 📊 Phase 0: Data Architecture Foundation

### Step 1: Define Domain Models

_Before writing any handlers or business logic, we must model our domain precisely_

```go
// internal/models/user.go
package models

import (
    "time"
    "github.com/google/uuid"
)

type User struct {
    ID        uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
    Email     string    `gorm:"uniqueIndex;size:255;not null" json:"email"`
    Name      string    `gorm:"size:255;not null" json:"name"`
    Password  string    `gorm:"size:255;not null" json:"-"` // Never expose in JSON
    CreatedAt time.Time `gorm:"autoCreateTime" json:"createdAt"`
    UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updatedAt"`

    // Relationships
    Notes []Note `gorm:"foreignKey:UserID" json:"-"`
}

// internal/models/note.go
type Note struct {
    ID        uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
    Title     string    `gorm:"size:255;not null" json:"title"`
    Document  Blocks    `gorm:"type:jsonb" json:"document"` // PostgreSQL JSONB
    IsPublic  bool      `gorm:"default:false" json:"isPublic"`
    CreatedAt time.Time `gorm:"autoCreateTime" json:"createdAt"`
    UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updatedAt"`

    // Foreign Key
    UserID uuid.UUID `gorm:"type:uuid;not null;index" json:"userId"`
    User   User      `gorm:"foreignKey:UserID" json:"-"`
}

// Blocks represents an array of Block structures stored as JSON
type Blocks []Block

type Block struct {
    ID       string                 `json:"id"`
    Type     BlockType              `json:"type"`
    Content  string                 `json:"content"`
    Metadata map[string]interface{} `json:"metadata,omitempty"`
    Children *Blocks                `json:"children,omitempty"`
}

type BlockType string

const (
    BlockTypeParagraph    BlockType = "paragraph"
    BlockTypeHeading      BlockType = "heading"
    BlockTypeTodo         BlockType = "todo"
    BlockTypeBulletList   BlockType = "bullet-list"
    BlockTypeNumberedList BlockType = "numbered-list"
)

// Validation
func (b Block) Validate() error {
    if b.ID == "" {
        return errors.New("block ID is required")
    }
    if b.Type == "" {
        return errors.New("block type is required")
    }
    return nil
}
```

### Step 2: Define Request/Response DTOs

_Separate internal models from API contracts_

```go
// internal/dto/auth.go
package dto

type RegisterRequest struct {
    Email    string `json:"email" validate:"required,email"`
    Name     string `json:"name" validate:"required,min=2,max=50"`
    Password string `json:"password" validate:"required,min=8"`
}

type LoginRequest struct {
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required"`
}

type AuthResponse struct {
    User  UserDTO `json:"user"`
    Token string  `json:"token"`
}

// internal/dto/note.go
type CreateNoteRequest struct {
    Title string `json:"title" validate:"required,max=255"`
}

type UpdateNoteRequest struct {
    Title    *string       `json:"title,omitempty" validate:"omitempty,max=255"`
    Document *models.Blocks `json:"document,omitempty"`
    IsPublic *bool         `json:"isPublic,omitempty"`
}

type NoteResponse struct {
    ID        string        `json:"id"`
    Title     string        `json:"title"`
    Document  models.Blocks `json:"document"`
    IsPublic  bool          `json:"isPublic"`
    CreatedAt time.Time     `json:"createdAt"`
    UpdatedAt time.Time     `json:"updatedAt"`
    UserID    string        `json:"userId"`
}

// Mapper functions (pure data transformations)
func ToNoteResponse(note models.Note) NoteResponse {
    return NoteResponse{
        ID:        note.ID.String(),
        Title:     note.Title,
        Document:  note.Document,
        IsPublic:  note.IsPublic,
        CreatedAt: note.CreatedAt,
        UpdatedAt: note.UpdatedAt,
        UserID:    note.UserID.String(),
    }
}
```

**Learning Objective**: See how domain modeling drives API design and data validation.

---

## 🏗️ Phase 1: Core Architecture Layers

### Step 3: Repository Layer (Data Access)

_Pure data persistence logic, no business rules_

```go
// internal/repository/interfaces.go
package repository

import (
    "context"
    "github.com/google/uuid"
    "notty/internal/models"
)

type UserRepository interface {
    Create(ctx context.Context, user *models.User) error
    GetByID(ctx context.Context, id uuid.UUID) (*models.User, error)
    GetByEmail(ctx context.Context, email string) (*models.User, error)
    Update(ctx context.Context, user *models.User) error
    Delete(ctx context.Context, id uuid.UUID) error
}

type NoteRepository interface {
    Create(ctx context.Context, note *models.Note) error
    GetByID(ctx context.Context, id uuid.UUID) (*models.Note, error)
    GetByUserID(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*models.Note, error)
    Update(ctx context.Context, note *models.Note) error
    Delete(ctx context.Context, id uuid.UUID) error
    GetPublicNotes(ctx context.Context, limit, offset int) ([]*models.Note, error)
}

// internal/repository/postgres/note_repository.go
package postgres

import (
    "context"
    "gorm.io/gorm"
    "notty/internal/models"
    "notty/internal/repository"
)

type noteRepository struct {
    db *gorm.DB
}

func NewNoteRepository(db *gorm.DB) repository.NoteRepository {
    return &noteRepository{db: db}
}

func (r *noteRepository) Create(ctx context.Context, note *models.Note) error {
    // Generate UUID if not set
    if note.ID == uuid.Nil {
        note.ID = uuid.New()
    }

    return r.db.WithContext(ctx).Create(note).Error
}

func (r *noteRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Note, error) {
    var note models.Note
    err := r.db.WithContext(ctx).
        Preload("User").
        First(&note, "id = ?", id).Error

    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, repository.ErrNotFound
        }
        return nil, err
    }

    return &note, nil
}

func (r *noteRepository) GetByUserID(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*models.Note, error) {
    var notes []*models.Note
    err := r.db.WithContext(ctx).
        Where("user_id = ?", userID).
        Order("updated_at DESC").
        Limit(limit).
        Offset(offset).
        Find(&notes).Error

    return notes, err
}
```

### Step 4: Service Layer (Business Logic)

_Core business rules and orchestration_

```go
// internal/service/interfaces.go
package service

import (
    "context"
    "github.com/google/uuid"
    "notty/internal/dto"
    "notty/internal/models"
)

type AuthService interface {
    Register(ctx context.Context, req dto.RegisterRequest) (*dto.AuthResponse, error)
    Login(ctx context.Context, req dto.LoginRequest) (*dto.AuthResponse, error)
    RefreshToken(ctx context.Context, token string) (*dto.AuthResponse, error)
}

type NoteService interface {
    CreateNote(ctx context.Context, userID uuid.UUID, req dto.CreateNoteRequest) (*dto.NoteResponse, error)
    GetNote(ctx context.Context, userID uuid.UUID, noteID uuid.UUID) (*dto.NoteResponse, error)
    UpdateNote(ctx context.Context, userID uuid.UUID, noteID uuid.UUID, req dto.UpdateNoteRequest) (*dto.NoteResponse, error)
    DeleteNote(ctx context.Context, userID uuid.UUID, noteID uuid.UUID) error
    ListUserNotes(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*dto.NoteResponse, error)
    GetPublicNotes(ctx context.Context, limit, offset int) ([]*dto.NoteResponse, error)
}

// internal/service/note_service.go
package service

import (
    "context"
    "errors"
    "github.com/google/uuid"
    "notty/internal/dto"
    "notty/internal/models"
    "notty/internal/repository"
)

type noteService struct {
    noteRepo repository.NoteRepository
    userRepo repository.UserRepository
}

func NewNoteService(noteRepo repository.NoteRepository, userRepo repository.UserRepository) NoteService {
    return &noteService{
        noteRepo: noteRepo,
        userRepo: userRepo,
    }
}

func (s *noteService) CreateNote(ctx context.Context, userID uuid.UUID, req dto.CreateNoteRequest) (*dto.NoteResponse, error) {
    // Validate user exists
    _, err := s.userRepo.GetByID(ctx, userID)
    if err != nil {
        if errors.Is(err, repository.ErrNotFound) {
            return nil, ErrUserNotFound
        }
        return nil, err
    }

    // Create note with initial empty paragraph block
    note := &models.Note{
        ID:     uuid.New(),
        Title:  req.Title,
        UserID: userID,
        Document: models.Blocks{
            {
                ID:      uuid.New().String(),
                Type:    models.BlockTypeParagraph,
                Content: "",
                Metadata: make(map[string]interface{}),
            },
        },
    }

    // Validate note structure
    for _, block := range note.Document {
        if err := block.Validate(); err != nil {
            return nil, fmt.Errorf("invalid block: %w", err)
        }
    }

    if err := s.noteRepo.Create(ctx, note); err != nil {
        return nil, err
    }

    response := dto.ToNoteResponse(*note)
    return &response, nil
}

func (s *noteService) GetNote(ctx context.Context, userID uuid.UUID, noteID uuid.UUID) (*dto.NoteResponse, error) {
    note, err := s.noteRepo.GetByID(ctx, noteID)
    if err != nil {
        return nil, err
    }

    // Authorization check
    if note.UserID != userID && !note.IsPublic {
        return nil, ErrForbidden
    }

    response := dto.ToNoteResponse(*note)
    return &response, nil
}

func (s *noteService) UpdateNote(ctx context.Context, userID uuid.UUID, noteID uuid.UUID, req dto.UpdateNoteRequest) (*dto.NoteResponse, error) {
    // Get existing note
    note, err := s.noteRepo.GetByID(ctx, noteID)
    if err != nil {
        return nil, err
    }

    // Authorization check
    if note.UserID != userID {
        return nil, ErrForbidden
    }

    // Apply updates
    if req.Title != nil {
        note.Title = *req.Title
    }
    if req.Document != nil {
        // Validate all blocks in document
        for _, block := range *req.Document {
            if err := block.Validate(); err != nil {
                return nil, fmt.Errorf("invalid block: %w", err)
            }
        }
        note.Document = *req.Document
    }
    if req.IsPublic != nil {
        note.IsPublic = *req.IsPublic
    }

    if err := s.noteRepo.Update(ctx, note); err != nil {
        return nil, err
    }

    response := dto.ToNoteResponse(*note)
    return &response, nil
}
```

**Learning Objective**: See how business logic is separated from data access and HTTP concerns.

---

## 🌐 Phase 2: HTTP API Layer

### Step 5: HTTP Handlers

_HTTP-specific concerns only_

```go
// internal/handler/note_handler.go
package handler

import (
    "encoding/json"
    "net/http"
    "strconv"

    "github.com/gorilla/mux"
    "github.com/google/uuid"
    "notty/internal/dto"
    "notty/internal/middleware"
    "notty/internal/service"
)

type NoteHandler struct {
    noteService service.NoteService
}

func NewNoteHandler(noteService service.NoteService) *NoteHandler {
    return &NoteHandler{
        noteService: noteService,
    }
}

func (h *NoteHandler) RegisterRoutes(r *mux.Router) {
    // All routes require authentication
    r.Handle("/notes", middleware.Auth(http.HandlerFunc(h.CreateNote))).Methods("POST")
    r.Handle("/notes", middleware.Auth(http.HandlerFunc(h.ListNotes))).Methods("GET")
    r.Handle("/notes/{id}", middleware.Auth(http.HandlerFunc(h.GetNote))).Methods("GET")
    r.Handle("/notes/{id}", middleware.Auth(http.HandlerFunc(h.UpdateNote))).Methods("PUT")
    r.Handle("/notes/{id}", middleware.Auth(http.HandlerFunc(h.DeleteNote))).Methods("DELETE")

    // Public routes
    r.HandleFunc("/notes/public", h.GetPublicNotes).Methods("GET")
}

func (h *NoteHandler) CreateNote(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()

    // Get user from auth middleware
    userID := middleware.GetUserIDFromContext(ctx)

    // Parse request body
    var req dto.CreateNoteRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
        return
    }

    // Validate request
    if err := validateStruct(req); err != nil {
        writeErrorResponse(w, "Validation failed", http.StatusBadRequest, err)
        return
    }

    // Call service
    note, err := h.noteService.CreateNote(ctx, userID, req)
    if err != nil {
        handleServiceError(w, err)
        return
    }

    // Return response
    writeJSONResponse(w, note, http.StatusCreated)
}

func (h *NoteHandler) GetNote(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    userID := middleware.GetUserIDFromContext(ctx)

    // Parse note ID from URL
    vars := mux.Vars(r)
    noteID, err := uuid.Parse(vars["id"])
    if err != nil {
        http.Error(w, "Invalid note ID", http.StatusBadRequest)
        return
    }

    // Call service
    note, err := h.noteService.GetNote(ctx, userID, noteID)
    if err != nil {
        handleServiceError(w, err)
        return
    }

    writeJSONResponse(w, note, http.StatusOK)
}

func (h *NoteHandler) UpdateNote(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    userID := middleware.GetUserIDFromContext(ctx)

    // Parse note ID
    vars := mux.Vars(r)
    noteID, err := uuid.Parse(vars["id"])
    if err != nil {
        http.Error(w, "Invalid note ID", http.StatusBadRequest)
        return
    }

    // Parse request body
    var req dto.UpdateNoteRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
        return
    }

    // Validate request
    if err := validateStruct(req); err != nil {
        writeErrorResponse(w, "Validation failed", http.StatusBadRequest, err)
        return
    }

    // Call service
    note, err := h.noteService.UpdateNote(ctx, userID, noteID, req)
    if err != nil {
        handleServiceError(w, err)
        return
    }

    writeJSONResponse(w, note, http.StatusOK)
}

func (h *NoteHandler) ListNotes(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    userID := middleware.GetUserIDFromContext(ctx)

    // Parse pagination parameters
    limit := 20 // default
    offset := 0 // default

    if l := r.URL.Query().Get("limit"); l != "" {
        if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
            limit = parsed
        }
    }

    if o := r.URL.Query().Get("offset"); o != "" {
        if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
            offset = parsed
        }
    }

    // Call service
    notes, err := h.noteService.ListUserNotes(ctx, userID, limit, offset)
    if err != nil {
        handleServiceError(w, err)
        return
    }

    writeJSONResponse(w, map[string]interface{}{
        "notes":  notes,
        "limit":  limit,
        "offset": offset,
    }, http.StatusOK)
}

// Helper functions for consistent HTTP responses
func writeJSONResponse(w http.ResponseWriter, data interface{}, statusCode int) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(statusCode)
    json.NewEncoder(w).Encode(map[string]interface{}{
        "data": data,
    })
}

func writeErrorResponse(w http.ResponseWriter, message string, statusCode int, details interface{}) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(statusCode)
    json.NewEncoder(w).Encode(map[string]interface{}{
        "error":   message,
        "details": details,
    })
}

func handleServiceError(w http.ResponseWriter, err error) {
    switch {
    case errors.Is(err, service.ErrNotFound):
        writeErrorResponse(w, "Resource not found", http.StatusNotFound, nil)
    case errors.Is(err, service.ErrForbidden):
        writeErrorResponse(w, "Access denied", http.StatusForbidden, nil)
    case errors.Is(err, service.ErrValidation):
        writeErrorResponse(w, "Validation error", http.StatusBadRequest, err.Error())
    default:
        writeErrorResponse(w, "Internal server error", http.StatusInternalServerError, nil)
    }
}
```

**Learning Objective**: Understand how HTTP handlers are thin layers that delegate to services.

---

## 🔐 Phase 3: Authentication & Authorization

### Step 6: JWT Authentication

```go
// internal/auth/jwt.go
package auth

import (
    "time"
    "github.com/golang-jwt/jwt/v5"
    "github.com/google/uuid"
)

type Claims struct {
    UserID uuid.UUID `json:"user_id"`
    Email  string    `json:"email"`
    jwt.RegisteredClaims
}

type JWTAuth struct {
    secretKey []byte
}

func NewJWTAuth(secretKey string) *JWTAuth {
    return &JWTAuth{
        secretKey: []byte(secretKey),
    }
}

func (j *JWTAuth) GenerateToken(userID uuid.UUID, email string) (string, error) {
    claims := Claims{
        UserID: userID,
        Email:  email,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            Issuer:    "notty-api",
        },
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(j.secretKey)
}

func (j *JWTAuth) ValidateToken(tokenString string) (*Claims, error) {
    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
        return j.secretKey, nil
    })

    if err != nil {
        return nil, err
    }

    if claims, ok := token.Claims.(*Claims); ok && token.Valid {
        return claims, nil
    }

    return nil, jwt.ErrSignatureInvalid
}

// internal/middleware/auth.go
package middleware

import (
    "context"
    "net/http"
    "strings"

    "notty/internal/auth"
)

type contextKey string

const UserIDKey contextKey = "user_id"

func Auth(jwtAuth *auth.JWTAuth) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // Get token from Authorization header
            authHeader := r.Header.Get("Authorization")
            if authHeader == "" {
                http.Error(w, "Authorization header required", http.StatusUnauthorized)
                return
            }

            tokenString := strings.TrimPrefix(authHeader, "Bearer ")
            if tokenString == authHeader {
                http.Error(w, "Invalid authorization header format", http.StatusUnauthorized)
                return
            }

            // Validate token
            claims, err := jwtAuth.ValidateToken(tokenString)
            if err != nil {
                http.Error(w, "Invalid token", http.StatusUnauthorized)
                return
            }

            // Add user ID to context
            ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
            next.ServeHTTP(w, r.WithContext(ctx))
        })
    }
}

func GetUserIDFromContext(ctx context.Context) uuid.UUID {
    if userID, ok := ctx.Value(UserIDKey).(uuid.UUID); ok {
        return userID
    }
    return uuid.Nil
}
```

---

## 🧪 Phase 4: Testing Strategy

### Step 7: Repository Testing

```go
// internal/repository/postgres/note_repository_test.go
package postgres_test

import (
    "context"
    "testing"
    "time"

    "github.com/google/uuid"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
    "notty/internal/models"
    "notty/internal/repository/postgres"
    "notty/internal/testutil"
)

func TestNoteRepository_Create(t *testing.T) {
    db := testutil.SetupTestDB(t)
    defer testutil.TeardownTestDB(t, db)

    repo := postgres.NewNoteRepository(db)
    ctx := context.Background()

    // Create a test user first
    user := &models.User{
        ID:    uuid.New(),
        Email: "test@example.com",
        Name:  "Test User",
    }
    require.NoError(t, db.Create(user).Error)

    note := &models.Note{
        Title:  "Test Note",
        UserID: user.ID,
        Document: models.Blocks{
            {
                ID:       uuid.New().String(),
                Type:     models.BlockTypeParagraph,
                Content:  "Hello world",
                Metadata: make(map[string]interface{}),
            },
        },
    }

    err := repo.Create(ctx, note)
    require.NoError(t, err)
    assert.NotEqual(t, uuid.Nil, note.ID)
    assert.False(t, note.CreatedAt.IsZero())
}

func TestNoteRepository_GetByID(t *testing.T) {
    db := testutil.SetupTestDB(t)
    defer testutil.TeardownTestDB(t, db)

    repo := postgres.NewNoteRepository(db)
    ctx := context.Background()

    // Setup test data
    user := &models.User{
        ID:    uuid.New(),
        Email: "test@example.com",
        Name:  "Test User",
    }
    require.NoError(t, db.Create(user).Error)

    originalNote := &models.Note{
        ID:     uuid.New(),
        Title:  "Test Note",
        UserID: user.ID,
        Document: models.Blocks{
            {
                ID:       uuid.New().String(),
                Type:     models.BlockTypeParagraph,
                Content:  "Hello world",
                Metadata: make(map[string]interface{}),
            },
        },
    }
    require.NoError(t, db.Create(originalNote).Error)

    // Test retrieval
    retrievedNote, err := repo.GetByID(ctx, originalNote.ID)
    require.NoError(t, err)
    assert.Equal(t, originalNote.ID, retrievedNote.ID)
    assert.Equal(t, originalNote.Title, retrievedNote.Title)
    assert.Equal(t, len(originalNote.Document), len(retrievedNote.Document))
}
```

### Step 8: Service Testing

```go
// internal/service/note_service_test.go
package service_test

import (
    "context"
    "testing"

    "github.com/google/uuid"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
    "github.com/stretchr/testify/require"
    "notty/internal/dto"
    "notty/internal/models"
    "notty/internal/service"
    "notty/internal/testutil/mocks"
)

func TestNoteService_CreateNote(t *testing.T) {
    // Setup mocks
    mockNoteRepo := &mocks.NoteRepository{}
    mockUserRepo := &mocks.UserRepository{}

    svc := service.NewNoteService(mockNoteRepo, mockUserRepo)
    ctx := context.Background()

    userID := uuid.New()
    req := dto.CreateNoteRequest{
        Title: "Test Note",
    }

    // Mock expectations
    mockUserRepo.On("GetByID", ctx, userID).Return(&models.User{
        ID:    userID,
        Email: "test@example.com",
        Name:  "Test User",
    }, nil)

    mockNoteRepo.On("Create", ctx, mock.AnythingOfType("*models.Note")).
        Return(nil).
        Run(func(args mock.Arguments) {
            note := args.Get(1).(*models.Note)
            // Verify the note structure
            assert.Equal(t, req.Title, note.Title)
            assert.Equal(t, userID, note.UserID)
            assert.NotEqual(t, uuid.Nil, note.ID)
            assert.Len(t, note.Document, 1)
            assert.Equal(t, models.BlockTypeParagraph, note.Document[0].Type)
        })

    // Execute
    response, err := svc.CreateNote(ctx, userID, req)

    // Verify
    require.NoError(t, err)
    assert.Equal(t, req.Title, response.Title)
    assert.Equal(t, userID.String(), response.UserID)
    assert.Len(t, response.Document, 1)

    mockUserRepo.AssertExpectations(t)
    mockNoteRepo.AssertExpectations(t)
}

func TestNoteService_GetNote_Forbidden(t *testing.T) {
    mockNoteRepo := &mocks.NoteRepository{}
    mockUserRepo := &mocks.UserRepository{}

    svc := service.NewNoteService(mockNoteRepo, mockUserRepo)
    ctx := context.Background()

    userID := uuid.New()
    noteID := uuid.New()
    ownerID := uuid.New() // Different from userID

    // Mock expectations
    mockNoteRepo.On("GetByID", ctx, noteID).Return(&models.Note{
        ID:       noteID,
        Title:    "Private Note",
        UserID:   ownerID,
        IsPublic: false, // Private note
    }, nil)

    // Execute
    _, err := svc.GetNote(ctx, userID, noteID)

    // Verify
    assert.ErrorIs(t, err, service.ErrForbidden)
    mockNoteRepo.AssertExpectations(t)
}
```

### Step 9: Integration Testing

```go
// tests/integration/note_api_test.go
package integration_test

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
    "notty/internal/dto"
    "notty/internal/testutil"
)

func TestNoteAPI_CreateAndRetrieve(t *testing.T) {
    // Setup test server
    server := testutil.SetupTestServer(t)
    defer server.Close()

    // Register and login user
    token := testutil.CreateTestUserAndLogin(t, server, "test@example.com", "Test User", "password123")

    // Create note
    createReq := dto.CreateNoteRequest{
        Title: "My Test Note",
    }

    reqBody, _ := json.Marshal(createReq)
    req := httptest.NewRequest("POST", "/api/notes", bytes.NewBuffer(reqBody))
    req.Header.Set("Authorization", "Bearer "+token)
    req.Header.Set("Content-Type", "application/json")

    w := httptest.NewRecorder()
    server.ServeHTTP(w, req)

    require.Equal(t, http.StatusCreated, w.Code)

    var createResp struct {
        Data dto.NoteResponse `json:"data"`
    }
    require.NoError(t, json.NewDecoder(w.Body).Decode(&createResp))

    noteID := createResp.Data.ID
    assert.Equal(t, "My Test Note", createResp.Data.Title)
    assert.Len(t, createResp.Data.Document, 1)

    // Retrieve note
    req = httptest.NewRequest("GET", fmt.Sprintf("/api/notes/%s", noteID), nil)
    req.Header.Set("Authorization", "Bearer "+token)

    w = httptest.NewRecorder()
    server.ServeHTTP(w, req)

    require.Equal(t, http.StatusOK, w.Code)

    var getResp struct {
        Data dto.NoteResponse `json:"data"`
    }
    require.NoError(t, json.NewDecoder(w.Body).Decode(&getResp))

    assert.Equal(t, noteID, getResp.Data.ID)
    assert.Equal(t, "My Test Note", getResp.Data.Title)
}

func TestNoteAPI_UpdateDocument(t *testing.T) {
    server := testutil.SetupTestServer(t)
    defer server.Close()

    token := testutil.CreateTestUserAndLogin(t, server, "test@example.com", "Test User", "password123")
    noteID := testutil.CreateTestNote(t, server, token, "Test Note")

    // Update note document
    newDocument := models.Blocks{
        {
            ID:      uuid.New().String(),
            Type:    models.BlockTypeParagraph,
            Content: "Updated content",
            Metadata: make(map[string]interface{}),
        },
        {
            ID:      uuid.New().String(),
            Type:    models.BlockTypeTodo,
            Content: "Todo item",
            Metadata: map[string]interface{}{
                "checked": false,
            },
        },
    }

    updateReq := dto.UpdateNoteRequest{
        Document: &newDocument,
    }

    reqBody, _ := json.Marshal(updateReq)
    req := httptest.NewRequest("PUT", fmt.Sprintf("/api/notes/%s", noteID), bytes.NewBuffer(reqBody))
    req.Header.Set("Authorization", "Bearer "+token)
    req.Header.Set("Content-Type", "application/json")

    w := httptest.NewRecorder()
    server.ServeHTTP(w, req)

    require.Equal(t, http.StatusOK, w.Code)

    var resp struct {
        Data dto.NoteResponse `json:"data"`
    }
    require.NoError(t, json.NewDecoder(w.Body).Decode(&resp))

    assert.Len(t, resp.Data.Document, 2)
    assert.Equal(t, "Updated content", resp.Data.Document[0].Content)
    assert.Equal(t, models.BlockTypeTodo, resp.Data.Document[1].Type)
    assert.Equal(t, false, resp.Data.Document[1].Metadata["checked"])
}
```

---

## 🚀 Phase 5: Application Bootstrap

### Step 10: Main Application Setup

```go
// cmd/server/main.go
package main

import (
    "context"
    "fmt"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"

    "github.com/gorilla/mux"
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    "notty/internal/auth"
    "notty/internal/config"
    "notty/internal/handler"
    "notty/internal/middleware"
    "notty/internal/models"
    "notty/internal/repository/postgres"
    "notty/internal/service"
)

func main() {
    // Load configuration
    cfg, err := config.Load()
    if err != nil {
        log.Fatal("Failed to load config:", err)
    }

    // Setup database
    db, err := setupDatabase(cfg.DatabaseURL)
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }

    // Auto-migrate models
    if err := db.AutoMigrate(&models.User{}, &models.Note{}); err != nil {
        log.Fatal("Failed to migrate database:", err)
    }

    // Initialize dependencies
    jwtAuth := auth.NewJWTAuth(cfg.JWTSecret)

    // Repositories
    userRepo := postgres.NewUserRepository(db)
    noteRepo := postgres.NewNoteRepository(db)

    // Services
    authService := service.NewAuthService(userRepo, jwtAuth)
    noteService := service.NewNoteService(noteRepo, userRepo)

    // Handlers
    authHandler := handler.NewAuthHandler(authService)
    noteHandler := handler.NewNoteHandler(noteService)

    // Setup router
    router := mux.NewRouter()

    // Middleware
    router.Use(middleware.CORS())
    router.Use(middleware.Logging())
    router.Use(middleware.RequestID())

    // API routes
    api := router.PathPrefix("/api").Subrouter()
    authHandler.RegisterRoutes(api)
    noteHandler.RegisterRoutes(api)

    // Health check
    router.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        w.Write([]byte("OK"))
    }).Methods("GET")

    // Start server
    server := &http.Server{
        Addr:         fmt.Sprintf(":%s", cfg.Port),
        Handler:      router,
        ReadTimeout:  15 * time.Second,
        WriteTimeout: 15 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    // Graceful shutdown
    go func() {
        log.Printf("Server starting on port %s", cfg.Port)
        if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatal("Server failed to start:", err)
        }
    }()

    // Wait for interrupt signal to gracefully shutdown
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    log.Println("Shutting down server...")

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    if err := server.Shutdown(ctx); err != nil {
        log.Fatal("Server forced to shutdown:", err)
    }

    log.Println("Server exited")
}

func setupDatabase(databaseURL string) (*gorm.DB, error) {
    db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
    if err != nil {
        return nil, err
    }

    // Test the connection
    sqlDB, err := db.DB()
    if err != nil {
        return nil, err
    }

    if err := sqlDB.Ping(); err != nil {
        return nil, err
    }

    return db, nil
}

// internal/config/config.go
package config

import (
    "os"
)

type Config struct {
    Port        string
    DatabaseURL string
    JWTSecret   string
}

func Load() (*Config, error) {
    config := &Config{
        Port:        getEnvOrDefault("PORT", "8080"),
        DatabaseURL: getEnvOrDefault("DATABASE_URL", "postgres://localhost:5432/notty?sslmode=disable"),
        JWTSecret:   getEnvOrDefault("JWT_SECRET", "your-secret-key"),
    }

    return config, nil
}

func getEnvOrDefault(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}
```

---

## 📋 Phase 6: Development Workflow

### API Documentation

```go
// docs/api.md or using OpenAPI/Swagger

// Authentication Endpoints
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh

// Note Endpoints
GET    /api/notes          // List user's notes
POST   /api/notes          // Create new note
GET    /api/notes/:id      // Get specific note
PUT    /api/notes/:id      // Update note
DELETE /api/notes/:id      // Delete note
GET    /api/notes/public   // Get public notes

// Request/Response Examples
POST /api/notes
{
  "title": "My Shopping List"
}

Response:
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "My Shopping List",
    "document": [
      {
        "id": "block-1",
        "type": "paragraph",
        "content": "",
        "metadata": {}
      }
    ],
    "isPublic": false,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "userId": "user-id"
  }
}
```

### Development Commands

```makefile
# Makefile
.PHONY: build run test test-integration clean migrate

build:
	go build -o bin/server cmd/server/main.go

run:
	go run cmd/server/main.go

test:
	go test -v ./...

test-integration:
	go test -v -tags=integration ./tests/integration/...

test-coverage:
	go test -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out

clean:
	rm -rf bin/ coverage.out

migrate:
	go run cmd/migrate/main.go

lint:
	golangci-lint run

docker-build:
	docker build -t notty-backend .

docker-run:
	docker run -p 8080:8080 --env-file .env notty-backend
```

---

## 🎯 Learning Outcomes

By following this backend plan, you will master:

1. **Clean Architecture**: Layer separation and dependency injection
2. **Data Modeling**: Precise domain modeling with Go structs
3. **API Design**: RESTful endpoints with proper HTTP status codes
4. **Testing Strategy**: Unit, integration, and repository testing
5. **Security**: JWT authentication and authorization
6. **Database Integration**: GORM usage and migration patterns
7. **Error Handling**: Consistent error patterns across layers

---

## 🔄 Development Phases Summary

1. **Phase 0**: Define domain models and data structures
2. **Phase 1**: Build repository and service layers
3. **Phase 2**: Create HTTP handlers and API endpoints
4. **Phase 3**: Implement authentication and authorization
5. **Phase 4**: Write comprehensive tests
6. **Phase 5**: Bootstrap application with configuration
7. **Phase 6**: Add development tooling and documentation

---

## 🚀 Getting Started

**Let's begin with Phase 0**:

1. Set up the Go project structure
2. Define domain models in `internal/models/`
3. Create the database schema
4. Set up basic GORM configuration

Ready to start building the robust backend for Notty? Each step builds naturally on the previous one, following the same data-driven principles that make your code maintainable and extensible.

The backend will provide a solid foundation for your React frontend to consume via clean, well-documented APIs!

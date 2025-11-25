# Implementation Plan - PAPERPAL AI Essay Coach

This implementation plan breaks down the PAPERPAL system into discrete, actionable coding tasks. Each task builds incrementally on previous work, with all code integrated into the application (no orphaned code).

---

- [x] 1. Initialize project structure and core configuration



  - Create monorepo structure with frontend (React + Kiro) and backend (Node.js/Express) workspaces
  - Set up TypeScript configuration for both frontend and backend
  - Configure build tools (Vite for frontend, tsup for backend)
  - Set up ESLint and Prettier for code quality
  - Create environment variable templates (.env.example)
  - Initialize Git repository with .gitignore





  - _Requirements: 9.1, 9.2, 10.1_

- [ ] 2. Set up backend infrastructure and database
  - [ ] 2.1 Configure Express server with TypeScript
    - Create Express app with middleware (cors, helmet, compression, body-parser)


    - Set up request logging with morgan
    - Configure error handling middleware
    - Create health check endpoint
    - _Requirements: 10.1, 10.2_


  
  - [ ] 2.2 Set up PostgreSQL database connection
    - Install and configure pg library with connection pooling
    - Create database migration system using node-pg-migrate
    - Implement database connection utility with retry logic


    - _Requirements: 10.2, 11.1_
  





  - [ ] 2.3 Create database schema and migrations
    - Write migration for users table with indexes
    - Write migration for essays table with indexes
    - Write migration for progress_snapshots table
    - Add foreign key constraints and check constraints


    - _Requirements: 11.1, 11.2_
  
  - [ ] 2.4 Set up Redis for caching and sessions
    - Configure Redis client with connection pooling
    - Implement cache utility functions (get, set, delete, clear)


    - Set up session store with Redis
    - _Requirements: 10.1, 10.3_

- [x] 3. Implement authentication system


  - [ ] 3.1 Create User model and repository
    - Define User TypeScript interface
    - Implement UserRepository with CRUD operations
    - Add password hashing with bcrypt (12 rounds)
    - Implement email validation
    - _Requirements: 11.2, 11.3_
  
  - [ ] 3.2 Build authentication service
    - Implement user registration with validation
    - Implement login with JWT token generation
    - Create refresh token mechanism





    - Add logout functionality with token invalidation
    - _Requirements: 11.2, 11.3_
  
  - [ ] 3.3 Create authentication middleware
    - Implement JWT verification middleware


    - Add rate limiting middleware (5 attempts per 15 minutes)
    - Create authorization middleware for protected routes




    - _Requirements: 11.2, 11.3_
  
  - [ ] 3.4 Build authentication API endpoints
    - POST /api/auth/register endpoint
    - POST /api/auth/login endpoint


    - POST /api/auth/refresh endpoint
    - POST /api/auth/logout endpoint
    - DELETE /api/auth/account endpoint (GDPR compliance)
    - _Requirements: 11.3, 11.4_
  



  - [ ]* 3.5 Write authentication tests
    - Unit tests for password hashing and validation




    - Integration tests for registration and login flows
    - Test rate limiting behavior
    - Test JWT token expiration and refresh
    - _Requirements: 11.2, 11.3_


- [ ] 4. Implement language detection service
  - [ ] 4.1 Integrate language detection library
    - Install and configure franc or similar library
    - Create language detection utility function
    - Add validation for supported languages (ID, ZH, EN)
    - Implement confidence threshold (95% accuracy requirement)

    - _Requirements: 1.3_
  
  - [ ] 4.2 Create language detection API endpoint
    - POST /api/language/detect endpoint
    - Return detected language with confidence score
    - Handle edge cases (mixed languages, short text)
    - _Requirements: 1.3_

- [ ] 5. Build LLM integration layer
  - [ ] 5.1 Create LLM client abstraction
    - Implement OpenAI API client with error handling






    - Add retry logic with exponential backoff (3 attempts max)
    - Set 30-second timeout for requests
    - Create prompt template system
    - _Requirements: 2.1, 2.2, 10.1_


  
  - [ ] 5.2 Implement correction prompt engineering
    - Design grammar correction prompt template
    - Design vocabulary improvement prompt template
    - Design structure analysis prompt template


    - Create JSON response parser for LLM output
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ] 5.3 Build LLM response caching
    - Implement Redis-based cache for common corrections
    - Add cache key generation based on essay content hash

    - Set cache TTL to 24 hours
    - _Requirements: 10.1_

- [ ] 6. Implement essay correction engine
  - [ ] 6.1 Create Correction service core logic
    - Define Correction and CorrectionResult TypeScript interfaces
    - Implement correction pipeline (detect → correct → score)
    - Add error position tracking in original text
    - Generate polished version from corrections
    - _Requirements: 2.1, 2.2, 2.6_
  




  - [ ] 6.2 Build scoring algorithm
    - Implement calculateScore function with weighted subscores
    - Calculate grammar, vocabulary, structure, fluency, coherence scores
    - Apply error density calculations
    - Ensure overall score is 0-100 range

    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ] 6.3 Implement correction categorization
    - Classify corrections by type (grammar, vocabulary, structure, style)
    - Assign severity levels (error, warning, suggestion)

    - Generate explanations for each correction
    - _Requirements: 2.3, 2.4_
  
  - [ ]* 6.4 Write correction engine tests
    - Unit tests for scoring algorithm accuracy


    - Test correction categorization logic
    - Validate error position tracking
    - Test polished version generation
    - _Requirements: 2.1, 2.2, 3.1_


- [ ] 7. Create Essay service and API
  - [ ] 7.1 Define Essay model and repository
    - Create Essay TypeScript interface
    - Implement EssayRepository with CRUD operations
    - Add essay encryption at rest (AES-256)
    - Implement pagination for essay listing
    - _Requirements: 7.1, 7.2, 11.1_
  
  - [ ] 7.2 Build essay submission workflow
    - Implement draft saving with auto-save support
    - Create essay submission queue with Bull




    - Add async processing for corrections
    - Update essay status (draft → processing → completed → failed)
    - _Requirements: 1.1, 1.2, 9.5_
  
  - [x] 7.3 Implement essay API endpoints

    - POST /api/essays/draft endpoint with validation (max 10,000 chars)
    - POST /api/essays/submit endpoint with language detection
    - GET /api/essays/:id endpoint with decryption
    - GET /api/essays endpoint with pagination and filters
    - DELETE /api/essays/:id endpoint
    - _Requirements: 1.1, 7.2, 7.3, 7.5_

  
  - [ ] 7.4 Add essay search and filtering
    - Implement search by date range
    - Add filter by language (ID, ZH, EN)
    - Add filter by score range


    - Add filter by topic
    - _Requirements: 7.3_
  
  - [ ]* 7.5 Write essay service tests
    - Test essay validation (length, format)
    - Test encryption and decryption
    - Test pagination logic
    - Test search and filter functionality
    - _Requirements: 7.1, 7.2, 7.3_






- [ ] 8. Implement progress tracking system
  - [ ] 8.1 Create Progress service
    - Define UserProgress and ProgressSnapshot interfaces

    - Implement progress calculation logic
    - Calculate total essays, average score, weekly improvement
    - Identify top 3 weakness categories from correction history
    - _Requirements: 4.1, 4.2, 4.3_


  
  - [ ] 8.2 Build rank calculation system
    - Implement calculateRank function (Bronze → Diamond)
    - Base rank on essay count and average score
    - Update rank on each essay completion
    - _Requirements: 4.4_
  
  - [ ] 8.3 Implement achievement system
    - Define achievement types and milestones
    - Track achievement progress
    - Trigger achievement notifications
    - _Requirements: 4.6_
  
  - [ ] 8.4 Create progress API endpoints
    - GET /api/progress endpoint for summary
    - GET /api/progress/trends endpoint with time-series data
    - GET /api/progress/weaknesses endpoint
    - GET /api/progress/achievements endpoint
    - _Requirements: 4.2, 4.3_
  
  - [ ] 8.5 Implement progress snapshot generation
    - Create daily snapshot job
    - Store snapshots in progress_snapshots table
    - Calculate rolling averages (7-day, 30-day)
    - _Requirements: 4.2_
  
  - [ ]* 8.6 Write progress tracking tests
    - Test rank calculation logic
    - Test weakness identification
    - Test improvement percentage calculations
    - Test achievement triggering
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 9. Build topic generation system
  - [ ] 9.1 Create Topic Generator service
    - Define Topic and TopicGenerationRequest interfaces
    - Implement rankToDifficulty mapping function
    - Build LLM prompt for topic generation
    - Parse and validate LLM response
    - _Requirements: 5.1, 5.2, 5.4_
  
  - [ ] 9.2 Implement personalized topic logic
    - Target user's weakness categories in topic generation
    - Adjust difficulty based on user rank
    - Support all topic modes (Academic, Professional, Creative, Exam-prep)
    - Generate topics in user's preferred language
    - _Requirements: 5.1, 5.2, 5.3, 5.5_
  
  - [ ] 9.3 Add topic caching and history
    - Cache generated topics in Redis (1 hour TTL)
    - Store topic history in database
    - Prevent duplicate topics for same user
    - _Requirements: 5.1_
  
  - [ ] 9.4 Create topic API endpoints
    - POST /api/topics/generate endpoint with personalization
    - GET /api/topics/history endpoint
    - _Requirements: 5.1, 5.4_
  
  - [ ]* 9.5 Write topic generator tests
    - Test difficulty mapping logic
    - Test weakness targeting
    - Test topic uniqueness
    - Test all topic modes
    - _Requirements: 5.1, 5.2, 5.4_

- [ ] 10. Implement translation service
  - [ ] 10.1 Create Translation service
    - Build LLM prompt for translation
    - Support ID ↔ EN, ID ↔ ZH, EN ↔ ZH translations
    - Maintain context and tone in translations
    - _Requirements: 6.2, 6.3_
  
  - [ ] 10.2 Add translation caching
    - Cache translations in Redis (24 hours TTL)
    - Generate cache keys from source text hash + language pair
    - _Requirements: 6.3_
  
  - [ ] 10.3 Create translation API endpoint
    - POST /api/translate endpoint
    - Validate source and target languages
    - Return translated text with metadata
    - _Requirements: 6.2_
  
  - [ ]* 10.4 Write translation tests
    - Test all language pair combinations
    - Test translation quality (manual review)
    - Test cache hit/miss behavior
    - _Requirements: 6.2, 6.3_

- [ ] 11. Build PDF export functionality
  - [ ] 11.1 Integrate PDF generation library
    - Install and configure pdfkit or puppeteer
    - Create PDF template with proper formatting
    - Support multi-language fonts (Chinese characters)
    - _Requirements: 8.3, 8.5_
  
  - [ ] 11.2 Implement PDF generation service
    - Generate PDF with username, score, original essay, corrections, polished version
    - Add syntax highlighting for corrections
    - Format layout for readability
    - _Requirements: 8.2_
  
  - [ ] 11.3 Add PDF storage and retrieval
    - Store generated PDFs in S3 or local storage
    - Implement PDF caching (generate once, serve multiple times)
    - Add PDF cleanup job (delete after 7 days)
    - _Requirements: 8.1, 8.4_
  
  - [ ] 11.4 Create PDF export API endpoint
    - GET /api/essays/:id/pdf endpoint
    - Stream PDF to client
    - Set proper content-type headers
    - _Requirements: 8.1, 8.4_
  
  - [ ]* 11.5 Write PDF export tests
    - Test PDF generation for all languages
    - Validate PDF content accuracy
    - Test font rendering for Chinese
    - _Requirements: 8.2, 8.3, 8.5_

- [ ] 12. Build frontend foundation
  - [ ] 12.1 Initialize React application with Kiro
    - Set up React 18+ with TypeScript
    - Configure Kiro for mobile deployment
    - Set up TailwindCSS for styling
    - Configure React Router for navigation
    - _Requirements: 9.1, 9.2_
  
  - [ ] 12.2 Set up state management and API client
    - Configure React Query for data fetching and caching
    - Create API client with axios
    - Implement request/response interceptors
    - Add authentication token management
    - _Requirements: 9.1_
  
  - [ ] 12.3 Create design system and shared components
    - Build Button, Input, Card, Modal base components
    - Create color palette and typography system
    - Implement responsive layout components
    - Add loading and error state components
    - _Requirements: 9.2, 9.3, 9.4_
  
  - [ ] 12.4 Implement offline storage
    - Configure IndexedDB for draft storage
    - Create offline sync queue
    - Add network status detection
    - _Requirements: 9.5_

- [ ] 13. Build authentication UI
  - [ ] 13.1 Create login and registration pages
    - Build registration form with validation
    - Build login form with error handling
    - Add password strength indicator
    - Implement "remember me" functionality
    - _Requirements: 11.2, 11.3_
  
  - [ ] 13.2 Implement authentication context
    - Create AuthContext with user state
    - Add login, logout, refresh token functions
    - Implement protected route wrapper
    - Add authentication persistence
    - _Requirements: 11.2_
  
  - [ ] 13.3 Build user settings page
    - Create settings form (language, theme, notifications)
    - Add account deletion with confirmation
    - Implement password change functionality
    - _Requirements: 6.4, 11.4_

- [ ] 14. Implement essay editor component
  - [ ] 14.1 Build rich text editor
    - Create textarea with syntax highlighting
    - Add character counter (max 10,000)
    - Implement auto-save every 30 seconds
    - Add language selector dropdown
    - _Requirements: 1.1, 1.4, 9.5_
  
  - [ ] 14.2 Add file upload functionality
    - Implement drag-and-drop file upload
    - Support .txt, .doc, .docx file formats
    - Extract and display text content
    - _Requirements: 1.2_
  
  - [ ] 14.3 Implement draft management
    - Save drafts to IndexedDB for offline access
    - Sync drafts to server when online
    - Load last draft on editor open
    - Add "discard draft" functionality
    - _Requirements: 9.5_
  
  - [ ] 14.4 Create essay submission flow
    - Add "Submit for Correction" button
    - Show loading state during processing
    - Handle submission errors gracefully
    - Navigate to correction view on success
    - _Requirements: 1.5, 2.1_

- [ ] 15. Build correction display component
  - [ ] 15.1 Create inline correction highlighting
    - Highlight incorrect words and sentences
    - Color-code by correction type (grammar, vocabulary, structure)
    - Add severity indicators (error, warning, suggestion)
    - _Requirements: 2.1, 2.5_
  
  - [ ] 15.2 Implement correction tooltips
    - Show corrected text on hover/tap
    - Display explanation in tooltip
    - Add "apply correction" button
    - _Requirements: 2.3, 2.4_
  
  - [ ] 15.3 Add correction toggle and views
    - Implement show/hide corrections toggle
    - Create side-by-side original vs corrected view
    - Display final polished version at bottom
    - _Requirements: 2.5, 2.6_
  
  - [ ] 15.4 Build correction filtering
    - Add filter by correction type
    - Add filter by severity
    - Show correction count by category
    - _Requirements: 2.1_

- [ ] 16. Implement score dashboard component
  - [ ] 16.1 Create overall score display
    - Build circular progress indicator (0-100)
    - Add color coding (red <60, yellow 60-79, green 80+)
    - Show score with animation
    - _Requirements: 3.1, 3.2_
  
  - [ ] 16.2 Build subscore visualization
    - Create bar charts for grammar, vocabulary, structure, fluency, coherence
    - Add labels and values
    - Implement responsive layout
    - _Requirements: 3.2_
  
  - [ ] 16.3 Add score comparison
    - Show comparison with previous essay
    - Display improvement/decline indicator
    - Show average score trend
    - _Requirements: 3.5_

- [ ] 17. Build progress tracking UI
  - [ ] 17.1 Create progress dashboard page
    - Display total essays completed
    - Show average score with trend
    - Display weekly improvement percentage
    - Show current rank badge
    - _Requirements: 4.2, 4.4_
  
  - [ ] 17.2 Implement score trend chart
    - Build line chart with Chart.js or Recharts
    - Show score over time (last 30 days)
    - Add hover tooltips with details
    - _Requirements: 4.2, 4.5_
  
  - [ ] 17.3 Create weakness analysis section
    - Display top 3 weakness categories
    - Show frequency counts
    - Add visual indicators (icons, colors)
    - _Requirements: 4.3_
  
  - [ ] 17.4 Build achievements display
    - Show earned achievements with badges
    - Display progress toward next achievements
    - Add achievement unlock animations
    - _Requirements: 4.6_

- [ ] 18. Implement topic generator UI
  - [ ] 18.1 Create topic selection page
    - Build mode selector (Academic, Professional, Creative, Exam-prep)
    - Add difficulty slider (1-5)
    - Add language selector
    - _Requirements: 5.3, 5.4, 5.5_
  
  - [ ] 18.2 Implement topic generation
    - Add "Generate Topic" button
    - Show loading state during generation
    - Display generated topic with title and description
    - Add "Regenerate" option
    - _Requirements: 5.1, 5.4_
  
  - [ ] 18.3 Build topic history view
    - Display previously used topics
    - Add "Use Again" functionality
    - Show topic metadata (date, mode, difficulty)
    - _Requirements: 5.1_
  
  - [ ] 18.4 Integrate topic with editor
    - Add "Start Writing" button that opens editor
    - Pre-populate editor with topic context
    - Link essay to topic for tracking
    - _Requirements: 5.1_

- [ ] 19. Build essay library UI
  - [ ] 19.1 Create essay library page
    - Implement grid/list view toggle
    - Display essay cards with metadata (date, language, score, topic)
    - Add pagination controls
    - _Requirements: 7.2, 7.3_
  
  - [ ] 19.2 Implement search and filtering
    - Add search bar for text search
    - Create filter dropdowns (language, score range, date range)
    - Add sort options (date, score)
    - Update results in real-time
    - _Requirements: 7.3, 7.4_
  
  - [ ] 19.3 Build essay detail view
    - Display original essay text
    - Show all corrections with highlights
    - Display final polished version
    - Show score breakdown
    - _Requirements: 7.4_
  
  - [ ] 19.4 Add essay management actions
    - Implement delete with confirmation modal
    - Add "Export PDF" button
    - Add "View Corrections" navigation
    - _Requirements: 7.5, 8.4_

- [ ] 20. Implement translation UI
  - [ ] 20.1 Create translation interface
    - Add translation button to essay view
    - Build language pair selector (source → target)
    - Show loading state during translation
    - _Requirements: 6.2_
  
  - [ ] 20.2 Display translation results
    - Show original and translated text side-by-side
    - Add "Copy Translation" button
    - Add "Save as New Essay" option
    - _Requirements: 6.2_

- [ ] 21. Build PDF export UI
  - [ ] 21.1 Implement PDF download
    - Add "Export PDF" button to essay detail view
    - Show loading state during generation
    - Trigger browser download on completion
    - _Requirements: 8.1, 8.4_
  
  - [ ] 21.2 Add PDF preview (optional)
    - Show PDF preview in modal before download
    - Add print functionality
    - _Requirements: 8.1_

- [ ] 22. Implement multi-language support
  - [ ] 22.1 Set up i18n framework
    - Install and configure react-i18next
    - Create translation files for ID, ZH, EN
    - Implement language switcher component
    - _Requirements: 6.4_
  
  - [ ] 22.2 Translate UI strings
    - Translate all static text in components
    - Add language-specific formatting (dates, numbers)
    - Test all three languages
    - _Requirements: 6.4_

- [ ] 23. Add error handling and loading states
  - [ ] 23.1 Implement error boundary
    - Create ErrorBoundary component
    - Add fallback UI for errors
    - Log errors to monitoring service
    - _Requirements: 9.4_
  
  - [ ] 23.2 Build error notification system
    - Create toast notification component
    - Display user-friendly error messages
    - Add retry functionality for failed requests
    - _Requirements: 9.4_
  
  - [ ] 23.3 Add loading states
    - Create skeleton loaders for all major components
    - Add spinner for async operations
    - Implement optimistic UI updates
    - _Requirements: 9.4_

- [ ] 24. Implement responsive design
  - [ ] 24.1 Optimize for mobile screens
    - Test all components on mobile viewport
    - Adjust layouts for small screens
    - Ensure touch targets are adequate (min 44px)
    - _Requirements: 9.1, 9.2_
  
  - [ ] 24.2 Optimize for tablets and desktop
    - Create responsive breakpoints
    - Adjust layouts for larger screens
    - Test on various screen sizes
    - _Requirements: 9.1, 9.2_

- [ ] 25. Add performance optimizations
  - [ ] 25.1 Implement code splitting
    - Lazy load routes with React.lazy
    - Split vendor bundles
    - Optimize bundle size
    - _Requirements: 10.1_
  
  - [ ] 25.2 Optimize rendering
    - Add React.memo to expensive components
    - Implement virtualization for essay library
    - Debounce search inputs
    - _Requirements: 10.1_
  
  - [ ] 25.3 Configure caching
    - Set up React Query cache configuration
    - Implement stale-while-revalidate strategy
    - Add cache invalidation on mutations
    - _Requirements: 10.1_

- [ ] 26. Set up monitoring and logging
  - [ ] 26.1 Integrate error tracking
    - Set up Sentry or similar service
    - Add error tracking to frontend and backend
    - Configure source maps for debugging
    - _Requirements: 10.2_
  
  - [ ] 26.2 Implement application logging
    - Add structured logging to backend
    - Log API requests and responses
    - Track performance metrics
    - _Requirements: 10.2_
  
  - [ ] 26.3 Set up analytics
    - Track user engagement metrics (DAU, essay completion rate)
    - Monitor feature usage
    - Track conversion funnel
    - _Requirements: 10.2_

- [ ] 27. Deploy and configure production environment
  - [ ] 27.1 Set up Docker containers
    - Create Dockerfile for backend
    - Create Dockerfile for frontend
    - Create docker-compose for local development
    - _Requirements: 10.2_
  
  - [ ] 27.2 Configure CI/CD pipeline
    - Set up automated testing on pull requests
    - Configure automated deployment to staging
    - Set up production deployment workflow
    - _Requirements: 10.2_
  
  - [ ] 27.3 Configure production infrastructure
    - Set up load balancer
    - Configure auto-scaling
    - Set up database backups
    - Configure CDN
    - _Requirements: 10.2, 10.3_
  
  - [ ] 27.4 Implement security measures
    - Configure SSL/TLS certificates
    - Set up rate limiting
    - Configure CORS policies
    - Enable security headers
    - _Requirements: 11.1, 11.2, 11.3_

- [ ]* 28. End-to-end testing
  - Write E2E tests for complete user flows
  - Test essay submission and correction flow
  - Test progress tracking and analytics
  - Test topic generation and essay writing
  - Test PDF export functionality
  - Test multi-language support
  - _Requirements: All_

---

## Implementation Notes

- Each task should be completed and tested before moving to the next
- All code must be integrated into the application (no orphaned code)
- Follow TypeScript best practices and maintain type safety
- Ensure all API endpoints have proper error handling
- Test each feature in all three languages (ID, ZH, EN)
- Maintain consistent code style using ESLint and Prettier
- Document complex logic with comments
- Keep performance requirements in mind (sub-4-second response times)

## Testing Strategy

- Write unit tests for business logic and utilities
- Write integration tests for API endpoints
- Optional: Write E2E tests for critical user flows
- Aim for 80%+ code coverage on core functionality
- Test error handling and edge cases
- Validate security measures (authentication, authorization, encryption)

## Success Criteria

- All requirements from requirements.md are implemented
- System meets performance targets (sub-4-second response, 50k MAU support)
- All three languages (ID, ZH, EN) are fully supported
- Security measures are in place (encryption, GDPR compliance)
- Application is responsive and works on mobile and web
- Code is well-tested and maintainable

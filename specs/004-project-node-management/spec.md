# Feature Specification: Project & Node Management

**Feature Branch**: `feature/004-project-node-management`

**Created**: 2026-11-05

**Status**: Draft

**Input**: User description: "Implement Feature 004 – Project & Node Management for DevSpace. DevSpace is a Personal 3D Knowledge Workspace with hierarchy User -> Workspace -> Area -> Project -> Node. Allow users to create and manage Projects inside their Areas, and organize each Project into Nodes representing its components, concepts or related entities. Scope includes Project Management (CRUD, name, description, icon, color), Node Management (CRUD, name, description, node type, exactly one project), Basic Node Relationships (connect nodes in same project, view/update/delete, prevent invalid/self references, keep independent of Three.js), Authorization (verify User -> Workspace -> Area -> Project -> Node ownership chain, uniform 404 for unauthorized access), Data Integrity (cascading deletion, no orphaned records). Out of scope: Three.js visualization, 3D models/geometry/materials/positioning/dragging/camera, project progress tracking, task management, kanban, AI, collaboration. Important design decisions: Nodes are conceptual components/entities, NOT Tasks; Node relationships represent business connections, NOT visual 3D lines; No positionX/Y/Z; Project status/progress belongs to Feature 007; Relationship management classified as Should Have for MVP."

## Clarifications

### Session 2026-11-05
- Q: Should Node Relationship management be included in the core Must Have scope for Feature 004, or remain a Should Have capability? → A: Option A — Keep as Should Have (Focus MVP core on Project and Node CRUD first; implement basic relationship management as a secondary phase within Feature 004).
- Q: Should Node types be a predefined curated enum or an extensible user-defined string? → A: Option A — Curated enum with custom fallback (`concept`, `component`, `service`, `module`, `database`, `interface`, `custom`) providing compile-time type safety and consistent UI badge styling.
- Q: How should Node Relationships model directionality and relationship semantics? → A: Option A — Directed relationships (Source → Target) with semantic types (`relates_to`, `depends_on`, `contains`) and an optional label, indexed uniquely on `[projectId, sourceNodeId, targetNodeId, type]`.
- Q: How should Projects be ordered and displayed within an Area? → A: Option A — Automatic recency sorting (`updatedAt` descending) by default, with client-side name/date sort toggles, keeping the backend data model simple without requiring manual order indexes or reorder endpoints.
- Q: Should Project and Node collection endpoints return unpaginated full lists or implement paginated queries? → A: Option A — Unpaginated full lists (`{ items: T[], total: number }`) matching existing Workspace and Area conventions, optimal for personal workspace scale and complete dataset availability for 2D relationship mapping.


## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Project within an Area (Priority: P1 - Must Have)

An authenticated user who has organized their workspace into Areas (e.g., "Backend Development", "System Architecture", or "Research") wants to establish distinct Projects within an active Area to represent specific initiatives, systems, applications, or subject tracks (e.g., "DevSpace Core API", "Event Streaming Engine", or "OAuth Service"). From the active Area canvas, the user clicks to create a new Project, provides a required Project name, and optionally supplies a description, an icon, and a theme accent color. Upon submission, the Project is created under the specified Area and appears immediately in the Area's project list.

**Why this priority**: Projects are the primary organizational container inside an Area. Without Projects, users cannot subdivide an Area's domain into tangible initiatives, nor can they introduce conceptual Nodes.

**Independent Test**: Can be tested independently by selecting an existing Area, initiating Project creation, submitting valid details, and verifying that the new Project appears in the Area's project collection, is persisted to storage, and belongs strictly to that Area.

**Acceptance Scenarios**:

1. **Given** an authenticated user viewing an active Area, **When** they submit a valid Project name (1–50 characters) with optional description, icon, and accent color, **Then** a new Project is created within that Area and rendered in the project list.
2. **Given** an authenticated user opens the Project creation dialog, **When** they submit an empty or whitespace-only name, **Then** the creation is blocked and an inline validation error prompts the user to enter a name.
3. **Given** an authenticated user submits a Project name that already exists within the same Area (case-insensitive comparison after trimming), **When** submitted, **Then** the system rejects the creation with a conflict notification indicating the name is already in use within this Area.
4. **Given** an authenticated user creates a Project without selecting an icon or color, **When** creation completes, **Then** the system assigns sensible default visual attributes (e.g., a default project icon and default accent color).

---

### User Story 2 - View Projects & Project Details within an Area (Priority: P1 - Must Have)

An authenticated user opens an Area containing several Projects. The user sees all Projects belonging strictly to that Area displayed in a clear 2D layout (such as project cards), each presenting its icon, name, description, accent color badge, and total node count. The user can click a Project to open its dedicated Project view and inspect its details, settings, and constituent Nodes.

**Why this priority**: Users must be able to explore the initiatives established within an Area and drill into individual Projects to view their conceptual architecture.

**Independent Test**: Can be tested independently by navigating to an Area with existing Projects, confirming that all projects belonging to that Area are listed accurately, and selecting a Project to view its complete detail summary.

**Acceptance Scenarios**:

1. **Given** an Area with multiple existing Projects, **When** the user views the Area, **Then** all Projects belonging to that Area are displayed with their respective names, icons, colors, descriptions, and Node counts.
2. **Given** an authenticated user selects a specific Project card or item, **When** selected, **Then** the system displays the Project's detail canvas and constituent Nodes.
3. **Given** an Area has zero Projects, **When** the user views the Area canvas, **Then** a friendly empty state is displayed explaining the role of Projects and offering a clear button to create the first Project.

---

### User Story 3 - Edit & Delete Projects with Safe Confirmation (Priority: P2 - Must Have)

An authenticated user wants to update the details of an existing Project (renaming it, updating its description, changing its icon, or modifying its accent color) as the initiative matures. Later, when a Project is deprecated or created by mistake, the user can permanently delete it. Because deletion removes the Project and all its downstream Nodes and relationships, the user must confirm the action in an explicit destructive confirmation modal.

**Why this priority**: Maintaining up-to-date project definitions and safely pruning obsolete initiatives is necessary for keeping the workspace accurate and free of clutter without risking accidental data loss.

**Independent Test**: Can be tested independently by editing an existing Project's attributes and confirming the changes persist, then deleting the Project via the confirmation flow and verifying that the Project and all associated Nodes and relationships are removed.

**Acceptance Scenarios**:

1. **Given** an authenticated user editing a Project they own, **When** they change its name, description, icon, or accent color and save, **Then** the updated attributes are saved and immediately reflected across the interface.
2. **Given** an authenticated user updates only a subset of Project fields (e.g., updating only the description), **When** saved, **Then** other attributes remain unchanged.
3. **Given** an authenticated user attempts to save an empty Project name during an update, **When** submitted, **Then** the system blocks the update with a clear validation message.
4. **Given** an authenticated user initiates Project deletion, **When** the delete action is triggered, **Then** a confirmation modal appears displaying the Project name and warning that all contained Nodes and connections will be permanently removed.
5. **Given** the user confirms deletion in the modal, **When** executed, **Then** the Project is permanently removed along with all its Nodes and relationships, and the view returns smoothly to the parent Area canvas.
6. **Given** the user cancels or dismisses the delete confirmation modal, **When** dismissed, **Then** no deletion occurs and the Project remains unchanged.

---

### User Story 4 - Create & Manage Conceptual Nodes within a Project (Priority: P1 - Must Have)

An authenticated user viewing a Project wants to define its conceptual building blocks—such as core components, domain concepts, subsystems, or related entities (e.g., "Auth Module", "User Profile", "Session Store", "API Gateway"). The user creates Nodes within the Project, specifying a Node name, an optional description, and a semantic Node type (e.g., Concept, Component, Service, Module, Database, Interface). The user can view all Nodes in the Project, open Node details, edit Node attributes, or delete obsolete Nodes.

**Why this priority**: Nodes are the primary conceptual entities within a Project. They enable users to break down complex projects into tangible, understandable units of knowledge and architecture.

**Independent Test**: Can be tested independently by opening a Project, creating multiple Nodes with various types, viewing the node list, editing a Node, and deleting a Node, confirming all operations persist under the target Project.

**Acceptance Scenarios**:

1. **Given** an authenticated user viewing a Project, **When** they submit a valid Node name (1–50 characters) and select a Node type with an optional description, **Then** the Node is created under that Project and appears in the Project's node collection.
2. **Given** an authenticated user opens the Node creation form, **When** they submit an empty or whitespace-only name, **Then** the system blocks submission and prompts for a valid name.
3. **Given** an authenticated user submits a Node name that already exists within the same Project (case-insensitive trimmed comparison), **When** submitted, **Then** the system rejects the creation with a conflict message indicating the name already exists in this Project.
4. **Given** an authenticated user views a Project with zero Nodes, **When** the Project canvas renders, **Then** a calm, inviting empty state explains the concept of Nodes and presents a button to create the first Node.
5. **Given** an authenticated user updates an existing Node's name, type, or description, **When** saved, **Then** the updated values are stored and reflected across the Project view.
6. **Given** an authenticated user deletes a Node, **When** confirmed, **Then** the Node is permanently removed from the Project, and any relationships connected to this Node are automatically removed.

---

### User Story 5 - Basic Node Relationships within a Project (Priority: P3 - Should Have)

An authenticated user who has created multiple Nodes within a Project wants to document business, conceptual, or architectural relationships between them (e.g., "API Gateway" connects to "Auth Module", or "Auth Module" depends on "Session Store"). The user creates a relationship by selecting a source Node, a target Node, and an optional relationship label or type (e.g., "relates to", "depends on", "contains"). The user can view all relationships within the Project, update a relationship's label, and delete relationships that no longer apply.

**Why this priority**: While Projects and Nodes deliver immediate standalone value for categorization, relationships add semantic richness by linking related concepts together. Classifying this as Should Have ensures a solid MVP core while supporting deeper knowledge mapping.

**Independent Test**: Can be tested independently by creating two Nodes within a Project, creating a relationship between them, verifying it appears in the Project's relationship list, updating its label, and deleting the relationship.

**Acceptance Scenarios**:

1. **Given** two distinct Nodes in the same Project, **When** the user creates a relationship between them with an optional relationship label, **Then** the relationship is recorded and displayed in the Project's relationship list.
2. **Given** an authenticated user attempts to create a relationship where the source Node and target Node are the same, **When** submitted, **Then** the system prevents the action and alerts the user that self-referencing relationships are not permitted.
3. **Given** an identical relationship already exists between the same source and target Nodes within the Project, **When** the user attempts to recreate it, **Then** the system rejects the duplicate relationship.
4. **Given** an authenticated user updates the label or type of an existing relationship, **When** saved, **Then** the updated relationship information is saved and reflected in the view.
5. **Given** an authenticated user deletes a relationship, **When** confirmed, **Then** the relationship is permanently removed while both connected Nodes remain completely intact.
6. **Given** an existing relationship connects Node A and Node B, **When** either Node A or Node B is deleted, **Then** the relationship connecting them is automatically deleted.

---

### User Story 6 - Strict Ownership Chain Authorization (Priority: P1 - Must Have)

An authenticated user interacts with Project, Node, or Relationship endpoints. The system strictly verifies the complete ownership and parentage chain:
`User → Workspace → Area → Project → Node` (and relationships).
A user can only view, create, update, or delete resources that belong to their own workspaces and areas. If a user attempts to access or modify a Project, Node, or Relationship belonging to another user, or references an entity under an incorrect parent path (e.g., Project A requested under Area B), the server responds with a uniform `404 Not Found` to prevent data leakage and resource enumeration.

**Why this priority**: DevSpace is a private personal knowledge workspace. Strict isolation across the entire hierarchy guarantees that no user can view, alter, or detect the presence of another user's knowledge base.

**Independent Test**: Can be tested independently by attempting to query or modify Projects, Nodes, or relationships using credentials from another account, or using mismatched hierarchy identifiers, verifying that all unauthorized or misaligned requests return 404 Not Found.

**Acceptance Scenarios**:

1. **Given** User A owns Workspace A, Area A, and Project A, **When** User B attempts to access, update, or delete Project A, **Then** the server responds with a uniform 404 Not Found.
2. **Given** User A owns Area A and Area B, and Project A belongs to Area A, **When** User A requests Project A under Area B, **Then** the server rejects the request with 404 Not Found due to parentage mismatch.
3. **Given** User B attempts to create, view, edit, or delete a Node or Relationship inside Project A, **When** processed, **Then** the server rejects the request with 404 Not Found.
4. **Given** an unauthenticated visitor attempts to access any Project, Node, or Relationship endpoint, **When** received, **Then** the request is rejected with an authentication required error.

---

### User Story 7 - Resilient UI States: Empty, Loading, and Error Management (Priority: P3 - Must Have)

A user navigates through their Areas and Projects under various conditions: when an Area has zero Projects, when a Project has zero Nodes, when data is loading, or when network requests fail. The application delivers calm, informative, and accessible states that guide the user gracefully.

**Why this priority**: High-quality state handling prevents confusion, ensures accessible interactions, and provides a polished, professional workspace experience.

**Independent Test**: Can be tested independently by navigating to empty Areas and Projects to verify empty states, simulating network delays to check skeletons, and simulating server errors to verify error retry banners.

**Acceptance Scenarios**:

1. **Given** an Area contains zero Projects, **When** the user views the Area, **Then** an informative empty state explains what Projects are and provides a prominent button to create the first Project.
2. **Given** a Project contains zero Nodes, **When** the user views the Project, **Then** an informative empty state explains how to organize concepts into Nodes and offers a button to add the first Node.
3. **Given** Project or Node data is being fetched over the network, **When** the request is in flight, **Then** accessible loading skeletons are displayed in place of the content.
4. **Given** an operation fails due to network or server issues, **When** an error occurs, **Then** an actionable error notice is presented with a retry option.
5. **Given** any successful creation, edit, or deletion of a Project, Node, or relationship, **When** the action completes, **Then** an ephemeral toast notification confirms the outcome.

---

### Edge Cases

- **Deleting an Area with existing Projects**: Cascades permanently to delete all Projects, Nodes, and Relationships within that Area without leaving orphaned records.
- **Deleting a Project with existing Nodes and Relationships**: Cascades permanently to delete all Nodes and all Relationships in that Project.
- **Deleting a Node with connected Relationships**: Automatically removes all incoming and outgoing relationships connected to that Node, keeping remaining Nodes and other relationships intact.
- **Self-referencing Relationship attempts**: Attempting to connect a Node to itself (`sourceNodeId === targetNodeId`) is prohibited in both client UI controls and backend validation with a clear error.
- **Cross-project Relationship attempts**: Attempting to create a relationship between Nodes belonging to different Projects is rejected by backend validation with a 400 Bad Request or 404 Not Found.
- **Duplicate Project names within an Area**: Project names must be unique within an Area (case-insensitive after trimming). Identical names within the same Area are rejected with a conflict error (`409 Conflict`). Identical Project names in different Areas are allowed.
- **Duplicate Node names within a Project**: Node names must be unique within a Project (case-insensitive after trimming). Identical names within the same Project are rejected with a conflict error (`409 Conflict`). Identical Node names in different Projects are allowed.
- **Whitespace handling**: All Project and Node names and descriptions must have leading and trailing whitespace trimmed. Names consisting solely of whitespace are rejected as invalid.
- **Mismatched hierarchy path routing**: Accessing `/workspaces/:workspaceId/areas/:areaId/projects/:projectId` where `projectId` belongs to a different area or workspace returns a uniform `404 Not Found`.
- **Node Type boundary validation**: Node types must conform to a defined set of recognized semantic types (`concept`, `component`, `service`, `module`, `database`, `interface`, `custom`); unrecognized types are rejected.
- **Empty state transitions**: When the last Project in an Area or the last Node in a Project is deleted, the view immediately transitions to the appropriate empty state without layout glitches or orphaned selection.

## Requirements *(mandatory)*

### Functional Requirements

#### Project Management (Must Have)

- **FR-001**: The system MUST allow authenticated users to create a new Project within an existing Area they own.
- **FR-002**: The system MUST require a name for each Project (1 to 50 characters, trimmed of leading and trailing whitespace).
- **FR-003**: The system MUST enforce that Project names are unique within their parent Area (case-insensitive comparison after trimming), rejecting duplicate names with a conflict error.
- **FR-004**: The system MUST support optional metadata for each Project, including an icon (selected from the curated preset catalog), an accent color (selected from the approved theme palette), and an optional description (up to 280 characters).
- **FR-005**: The system MUST assign default visual attributes (e.g., default project icon and default accent color) when icon or color are omitted during Project creation.
- **FR-006**: The system MUST associate every Project with exactly one parent Area.
- **FR-007**: The system MUST allow authenticated users to retrieve all Projects belonging to a specified Area as an unpaginated collection (`{ items: ProjectDto[], total: number }`), ordered by `updatedAt` descending by default, while supporting client-side sorting by name or date.
- **FR-008**: The system MUST allow authenticated users to retrieve detailed information for a specific Project, including name, description, icon, color, node count, and timestamps.
- **FR-009**: The system MUST allow authenticated users to update an existing Project's name, description, icon, and accent color.
- **FR-010**: The system MUST preserve existing values for any Project attributes not explicitly updated during an update operation.
- **FR-011**: The system MUST allow authenticated users to delete a Project they own.
- **FR-012**: The system MUST require explicit user confirmation through a destructive confirmation modal displaying the Project name and permanent consequence warning before deleting a Project.

#### Node Management (Must Have)

- **FR-013**: The system MUST allow authenticated users to create conceptual Nodes within an existing Project they own.
- **FR-014**: The system MUST require a name for each Node (1 to 50 characters, trimmed of leading and trailing whitespace).
- **FR-015**: The system MUST enforce that Node names are unique within their parent Project (case-insensitive comparison after trimming), rejecting duplicate names with a conflict error.
- **FR-016**: The system MUST support an optional description for each Node (up to 280 characters).
- **FR-017**: The system MUST support a semantic Node type for each Node, chosen from an approved set of types (`concept`, `component`, `service`, `module`, `database`, `interface`, `custom`), defaulting to `concept` if omitted.
- **FR-018**: The system MUST associate every Node with exactly one parent Project.
- **FR-019**: The system MUST allow authenticated users to retrieve all Nodes belonging to a specified Project as an unpaginated collection (`{ items: NodeDto[], total: number }`), ordered by creation date ascending by default.
- **FR-020**: The system MUST allow authenticated users to retrieve detailed information for a specific Node.
- **FR-021**: The system MUST allow authenticated users to update an existing Node's name, description, and node type.
- **FR-022**: The system MUST allow authenticated users to delete a Node they own.
- **FR-023**: The system MUST treat Nodes strictly as conceptual entities and architectural components within a Project, NOT as tasks, todos, or work items.

#### Authorization & Hierarchy Validation (Must Have)

- **FR-024**: The system MUST enforce the full ownership chain for all Project operations: `User → Workspace → Area → Project`.
- **FR-025**: The system MUST enforce the full ownership chain for all Node operations: `User → Workspace → Area → Project → Node`.
- **FR-026**: The system MUST enforce the full ownership chain for all Relationship operations: `User → Workspace → Area → Project → Relationship`.
- **FR-027**: The system MUST structure API routes hierarchically to express parentage:
  - Projects: `/workspaces/:workspaceId/areas/:areaId/projects`
  - Nodes: `/workspaces/:workspaceId/areas/:areaId/projects/:projectId/nodes`
  - Relationships: `/workspaces/:workspaceId/areas/:areaId/projects/:projectId/relationships`
- **FR-028**: The system MUST return a uniform `404 Not Found` response whenever a user attempts to access, modify, or delete a Project, Node, or Relationship they do not own, or when any parent-child relationship in the hierarchy does not match.
- **FR-029**: The system MUST require valid authentication for all Project, Node, and Relationship operations.

#### Data Integrity & Cascading Behavior (Must Have)

- **FR-030**: When an Area is deleted, the system MUST cascade-delete all Projects within that Area, along with all their Nodes and Relationships.
- **FR-031**: When a Project is deleted, the system MUST cascade-delete all Nodes and all Relationships within that Project.
- **FR-032**: When a Node is deleted, the system MUST cascade-delete all Relationships where that Node is the source or target.
- **FR-033**: The system MUST prevent orphaned records across all hierarchy levels under all circumstances.

#### User Interface & Experience (Must Have)

- **FR-034**: The system MUST provide an intuitive empty state when an Area has zero Projects, explaining what Projects are and inviting creation of the first Project.
- **FR-035**: The system MUST provide an intuitive empty state when a Project has zero Nodes, explaining what Nodes are and inviting creation of the first Node.
- **FR-036**: The system MUST display accessible loading indicators or skeletons during data fetch operations.
- **FR-037**: The system MUST display actionable error messages with retry capabilities when operations fail, and ephemeral toast confirmations when operations succeed.

#### Basic Node Relationships (Should Have)

- **FR-038**: The system SHOULD allow authenticated users to create a directed conceptual relationship from a source Node to a distinct target Node belonging to the same Project.
- **FR-039**: The system SHOULD require a valid source Node and a valid target Node for each relationship, verifying that both Nodes belong strictly to the specified Project.
- **FR-040**: The system SHOULD prohibit self-referencing relationships where the source Node and target Node are the same entity.
- **FR-041**: The system SHOULD support a semantic relationship type (`relates_to`, `depends_on`, `contains`) and an optional text label (up to 100 characters) describing the connection.
- **FR-042**: The system SHOULD prevent duplicate relationships between the same source Node, target Node, and relationship type within a Project by enforcing a unique constraint on `[projectId, sourceNodeId, targetNodeId, type]`.
- **FR-043**: The system SHOULD allow authenticated users to retrieve, update the label/type of, and delete existing relationships within a Project.
- **FR-044**: The system SHOULD maintain relationship data strictly independent of visual 3D scene rendering, 3D line geometries, or camera perspectives.

---

### Key Entities *(include if feature involves data)*

- **Project**: A high-level initiative, application, or conceptual subsystem within an Area.
  - *Identifier (`id`)*: Unique string identifier distinguishing the Project.
  - *Area Identifier (`areaId`)*: Reference to the parent Area that exclusively owns this Project.
  - *Name (`name`)*: Human-readable name of the Project (mandatory, 1–50 characters, unique per Area).
  - *Description (`description`)*: Optional description or summary of the Project (up to 280 characters).
  - *Icon (`icon`)*: Visual symbol token selected from the curated preset catalog.
  - *Color (`color`)*: Visual accent color token selected from the approved theme palette.
  - *Timestamps (`createdAt`, `updatedAt`)*: Timestamps tracking when the Project was created and last updated.

- **Node**: A conceptual component, module, domain entity, or architectural unit within a Project.
  - *Identifier (`id`)*: Unique string identifier distinguishing the Node.
  - *Project Identifier (`projectId`)*: Reference to the parent Project that exclusively owns this Node.
  - *Name (`name`)*: Human-readable name of the Node (mandatory, 1–50 characters, unique per Project).
  - *Description (`description`)*: Optional description of the Node (up to 280 characters).
  - *NodeType (`nodeType`)*: Semantic category of the Node (e.g., `concept`, `component`, `service`, `module`, `database`, `interface`, `custom`).
  - *Timestamps (`createdAt`, `updatedAt`)*: Timestamps tracking when the Node was created and last updated.

- **NodeRelationship**: A business-level or conceptual link connecting two Nodes within the same Project.
  - *Identifier (`id`)*: Unique string identifier distinguishing the relationship.
  - *Project Identifier (`projectId`)*: Reference to the parent Project containing both connected Nodes.
  - *Source Node Identifier (`sourceNodeId`)*: Reference to the originating Node.
  - *Target Node Identifier (`targetNodeId`)*: Reference to the destination Node.
  - *Type (`type`)*: Semantic category of the directed connection (`relates_to`, `depends_on`, `contains`).
  - *Label (`label`)*: Optional human-readable description of the relationship (up to 100 characters).
  - *Timestamps (`createdAt`, `updatedAt`)*: Timestamps tracking when the relationship was created and last updated.

- **Area**: (Parent entity established in Feature 003) The operational domain containing zero, one, or many Projects.
- **Workspace**: (Grandparent entity established in Feature 002) The root workspace container.
- **User**: (Owner entity established in Feature 001) The authenticated owner of the hierarchy.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a new Project within an Area in under 10 seconds from within the Area canvas.
- **SC-002**: Users can create a new conceptual Node within a Project in under 8 seconds.
- **SC-003**: 100% of Project, Node, and Relationship operations verify the full ownership chain (`User → Workspace → Area → Project → Node`), resulting in zero unauthorized access or resource enumeration across accounts or workspaces.
- **SC-004**: 100% of invalid hierarchy requests (such as requesting a Project with a mismatched Area ID) return a uniform not-found response without disclosing resource existence.
- **SC-005**: 100% of cascading delete actions (deleting an Area, Project, or Node) cleanly remove all subordinate entities and relationships, leaving zero orphaned records in storage.
- **SC-006**: 100% of self-referencing relationship attempts and cross-project node connection attempts are blocked with clear feedback.
- **SC-007**: 100% of empty Areas and empty Projects present an actionable onboarding empty state guiding the user to create their first item.
- **SC-008**: Project listing and Node listing views render and respond to user interactions in under 300 milliseconds under standard network conditions.

## Assumptions

- **Single-User Scope**: Consistent with DevSpace's personal workspace architecture (Features 001–003), Projects and Nodes are owned strictly by the single user who owns the root Workspace. Collaborative editing, shared projects, and multi-tenant permissions are out of scope.
- **Strict Hierarchy**: Every Project belongs to exactly one Area, and every Node belongs to exactly one Project. Moving Projects across Areas or transferring Nodes between Projects is not supported in this feature.
- **2D-First Architecture**: In strict adherence to Constitution Principle I (2D-First, 3D-Enhanced) and Principle IV (Purposeful 3D Development), all Project, Node, and Relationship management capabilities are implemented using standard 2D interfaces (cards, lists, dialogs, detail panels, forms). Three.js 3D rendering and visual scene objects are completely out of scope for this feature.
- **Decoupled Spatial Coordinates**: In accordance with Constitution Principle IV and the technical boundaries, no spatial coordinate fields (such as `positionX`, `positionY`, `positionZ`) are included on Project, Node, or Relationship domain models. Spatial positioning and layout are strictly visual concerns that belong to future 3D scene layers.
- **Nodes are Conceptual Entities, NOT Tasks**: Nodes represent architecture, concepts, components, or domain entities. They do not possess task statuses (e.g., "in progress", "done"), assignees, due dates, or checklist items.
- **Project Progress Deferred**: Project status, progress tracking, and milestone metrics belong to Feature 007 and are excluded from Feature 004.
- **Relationship Scope (Should Have)**: Basic Node relationships represent conceptual connections between Nodes within the same Project. To keep the MVP manageable, relationship management is classified as Should Have, while Project and Node CRUD are Must Have.
- **Visual Design Tokens Reused**: Project visual configuration reuses the established curated icon presets and 8-color theme palette defined in `@devspace/contracts`, ensuring consistency across Workspaces, Areas, and Projects without duplicate code.
- **Collection Query Strategy**: Consistent with Feature 002 (Workspaces) and Feature 003 (Areas), Project and Node collection endpoints return unpaginated datasets (`{ items: T[], total: number }`), matching the personal workspace scope (typically under 100 entities per container) and providing complete collections for client-side sorting and 2D relationship mapping.
- **Dependencies**: Feature 004 directly depends on Feature 001 (User Authentication & Session Management), Feature 002 (Workspace Management), and Feature 003 (Area Management).


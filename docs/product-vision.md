# DevSpace — Product Vision

> **Version:** 1.0  
> **Status:** Draft  
> **Product Type:** Personal 3D Knowledge Workspace

## 1. Product Overview

### 1.1. Introduction

**DevSpace** là một không gian làm việc cá nhân (Personal Workspace), cho phép người dùng tổ chức, quản lý và trực quan hóa kiến thức, dự án và quá trình phát triển bản thân thông qua một môi trường 3D tương tác.

Thay vì hiển thị toàn bộ thông tin dưới dạng danh sách, bảng hoặc các trang quản lý truyền thống, DevSpace sử dụng một không gian 3D có cấu trúc:

- **Islands:** Đại diện cho các lĩnh vực hoặc khu vực làm việc (Areas).
- **Structures:** Đại diện cho các dự án hoặc đối tượng bên trong mỗi khu vực.
- **Nodes:** Biểu diễn các thành phần và mối liên hệ giữa những đối tượng trong không gian.

Người dùng có thể khám phá không gian, tương tác với các đối tượng 3D và truy cập giao diện quản lý chi tiết tương ứng.

DevSpace hướng đến việc biến dữ liệu cá nhân thành một không gian trực quan, có tổ chức và phản ánh quá trình phát triển của người dùng.

### 1.2. Vision Statement

> Xây dựng một không gian làm việc cá nhân nơi kiến thức, dự án và mục tiêu không chỉ được lưu trữ mà còn được kết nối, trực quan hóa và khám phá thông qua một môi trường 3D tương tác.

### 1.3. Product Positioning

DevSpace không hướng đến việc thay thế hoàn toàn các công cụ quản lý công việc truyền thống.

Thay vào đó, sản phẩm tập trung vào trải nghiệm tổ chức thông tin theo không gian, giúp người dùng có cái nhìn tổng quan về những gì đang học, đang xây dựng và đã đạt được.

**Core Value Proposition:**

- Spatial Organization: Tổ chức thông tin bằng không gian 3D thay vì chỉ sử dụng danh sách phân cấp.
- Visual Understanding: Trực quan hóa trạng thái và mối liên hệ giữa các đối tượng.
- Personal Ownership: Cho phép người dùng tự xây dựng và tổ chức không gian làm việc của riêng mình.
- Extensibility: Có nền tảng dữ liệu đủ linh hoạt để mở rộng thêm các tính năng trong tương lai.

---

## 2. Problem Statement

### 2.1. Existing Problems

Các công cụ quản lý cá nhân hiện nay thường sử dụng danh sách, bảng Kanban, thư mục hoặc các trang dashboard để tổ chức thông tin.

Mặc dù những phương pháp này hiệu quả trong việc quản lý dữ liệu, chúng vẫn có một số hạn chế:

1. **Thiếu tính trực quan về không gian:** Thông tin thường được tổ chức theo cấu trúc tuyến tính hoặc phân cấp, khiến người dùng khó hình dung tổng thể hệ thống cá nhân.
2. **Thông tin bị phân tách:** Kiến thức, dự án và các hoạt động liên quan thường nằm ở những khu vực khác nhau.
3. **Khó nhận biết mối liên hệ:** Người dùng có thể lưu trữ nhiều thông tin nhưng chưa có cách trực quan để khám phá mối quan hệ giữa chúng.
4. **Trải nghiệm thiếu tính khám phá:** Việc quản lý thông tin chủ yếu thông qua thao tác CRUD truyền thống, chưa tạo được cảm giác tương tác với một không gian thống nhất.

### 2.2. Proposed Solution

DevSpace giải quyết những vấn đề trên bằng cách xây dựng một môi trường 3D tương tác, trong đó mỗi khu vực và đối tượng đại diện cho một phần dữ liệu thực tế của người dùng.

Thay vì chỉ truy cập thông tin thông qua menu hoặc danh sách, người dùng có thể:

- Quan sát toàn bộ workspace dưới dạng một không gian 3D.
- Di chuyển giữa các khu vực thông qua những hòn đảo.
- Khám phá các dự án và đối tượng bên trong từng khu vực.
- Quan sát mối liên hệ giữa các đối tượng thông qua các node và đường kết nối.
- Chọn đối tượng để xem hoặc chỉnh sửa thông tin trong giao diện quản lý.

---

## 3. Target Users

### 3.1. Primary Target User

DevSpace hướng đến **người dùng cá nhân (Individual Users)** có nhu cầu tổ chức và quản lý quá trình học tập, phát triển kỹ năng và thực hiện các dự án cá nhân.

Đặc điểm:

- Thường xuyên học tập và tiếp nhận kiến thức mới.
- Có nhiều dự án cá nhân hoặc mục tiêu cần theo dõi.
- Muốn tổ chức thông tin theo một cấu trúc rõ ràng.
- Thích trải nghiệm trực quan và tương tác thay vì chỉ sử dụng các danh sách truyền thống.
- Muốn theo dõi tiến độ phát triển của bản thân theo thời gian.

### 3.2. User Persona

**Persona: Personal Builder**

| Attribute | Description |
|---|---|
| Role | Student / Developer / Self-learner |
| Goal | Quản lý kiến thức, dự án và tiến độ cá nhân |
| Pain Point | Thông tin phân tán, khó nhìn thấy tổng thể |
| Motivation | Muốn có một không gian riêng để tổ chức và khám phá công việc |
| Technical Level | Có khả năng sử dụng các công cụ kỹ thuật số |

### 3.3. User Needs

Người dùng cần có khả năng:

1. Tạo và quản lý không gian làm việc cá nhân.
2. Tổ chức công việc thành các khu vực riêng biệt.
3. Quản lý các dự án thuộc từng khu vực.
4. Theo dõi trạng thái và tiến độ thực hiện.
5. Quan sát tổng thể workspace thông qua môi trường 3D.
6. Tương tác với các đối tượng 3D để truy cập thông tin chi tiết.

---

## 4. Product Concept

### 4.1. Spatial Workspace

DevSpace sử dụng một không gian 3D làm giao diện tổng quan chính.

Không gian được tổ chức theo mô hình phân cấp kết hợp với các mối liên kết:

```text
Workspace
│
├── Area: Backend Development
│   ├── Project: DevSpace
│   │   ├── Node: Authentication
│   │   ├── Node: Workspace Management
│   │   └── Node: 3D Visualization
│   │
│   └── Project: Learning Java
│
├── Area: Artificial Intelligence
│   ├── Project: Emotion Analysis
│   └── Project: Recommendation System
│
└── Area: Personal Development
    └── Project: English Learning
```

Đây là ví dụ minh họa cách tổ chức dữ liệu, không phải cấu trúc cố định mà mọi người dùng bắt buộc phải tuân theo.

### 4.2. Hybrid 3D Experience

DevSpace kết hợp ba thành phần chính:

**1. Islands — Spatial Areas**

- Mỗi hòn đảo đại diện cho một Area.
- Mỗi Area có tên, mô tả và thông tin tổng quan.
- Các đảo được bố trí trong một không gian 3D thống nhất.
- Người dùng có thể chọn một đảo để khám phá khu vực tương ứng.

**2. Structures — Projects**

- Các công trình hoặc đối tượng 3D đại diện cho Project.
- Mỗi Project thuộc một Area.
- Hình dạng hoặc trạng thái trực quan có thể phản ánh tiến độ dự án.
- Người dùng có thể chọn một đối tượng để xem thông tin chi tiết.

**3. Nodes — Relationships**

- Node biểu diễn các thành phần hoặc đối tượng liên quan.
- Đường kết nối biểu diễn mối quan hệ giữa các đối tượng.
- Cho phép mở rộng khả năng trực quan hóa kiến thức và sự liên kết giữa các dự án trong tương lai.

### 4.3. 2D Management Interface

Không phải mọi thao tác đều thực hiện trực tiếp trong môi trường 3D.

DevSpace kết hợp giao diện 3D với các thành phần giao diện 2D:

- Sidebar: Điều hướng và truy cập các chức năng.
- Detail Panel: Hiển thị thông tin đối tượng được chọn.
- Modal / Form: Tạo mới và chỉnh sửa dữ liệu.
- Dashboard: Hiển thị thông tin tổng quan và tiến độ.

Môi trường 3D chịu trách nhiệm trực quan hóa và khám phá, trong khi giao diện 2D đảm nhiệm các thao tác quản lý dữ liệu chính xác.

---

## 5. Product Goals

### 5.1. Primary Goals

DevSpace phiên bản MVP hướng đến các mục tiêu:

| ID | Goal | Description |
|---|---|---|
| G-01 | Personal Workspace | Cho phép người dùng tạo và quản lý workspace cá nhân |
| G-02 | Spatial Organization | Tổ chức thông tin thông qua các khu vực 3D |
| G-03 | Project Management | Quản lý dự án thuộc từng khu vực |
| G-04 | 3D Interaction | Cho phép tương tác với các đối tượng trong không gian 3D |
| G-05 | Progress Visualization | Trực quan hóa trạng thái và tiến độ dự án |
| G-06 | Extensible Foundation | Xây dựng nền tảng có khả năng mở rộng thêm các loại dữ liệu và mối quan hệ |

### 5.2. Success Criteria

MVP được xem là đạt mục tiêu khi đáp ứng được các tiêu chí:

- Người dùng có thể tạo và truy cập workspace cá nhân.
- Người dùng có thể tạo, cập nhật và xóa các Area.
- Người dùng có thể quản lý Project thuộc từng Area.
- Các Area được biểu diễn trong không gian 3D.
- Người dùng có thể chọn và tương tác với các đối tượng 3D.
- Thông tin chi tiết được hiển thị chính xác khi chọn đối tượng.
- Trạng thái và tiến độ dự án được phản ánh trong giao diện.
- Dữ liệu được lưu trữ và đồng bộ ổn định giữa các lần truy cập.

---

## 6. MVP Scope

### 6.1. In Scope

Các chức năng thuộc phạm vi MVP:

| Feature | Description | Priority |
|---|---|---|
| Workspace Management | Tạo và quản lý workspace cá nhân | Must Have |
| Area Management | CRUD các khu vực trong workspace | Must Have |
| Project Management | CRUD các dự án thuộc Area | Must Have |
| 3D Workspace | Hiển thị không gian 3D tổng quan | Must Have |
| Island Interaction | Chọn và khám phá các Area | Must Have |
| Project Interaction | Tương tác với các Project trong Area | Must Have |
| Detail Panel | Hiển thị thông tin đối tượng được chọn | Must Have |
| Progress Tracking | Theo dõi trạng thái và tiến độ Project | Must Have |
| Basic Relationships | Hỗ trợ biểu diễn các mối liên hệ cơ bản giữa đối tượng | Should Have |

### 6.2. Out of Scope

Các tính năng sau không thuộc phạm vi MVP:

- Collaborative Workspace và quản lý thành viên.
- Real-time collaboration.
- Chat và giao tiếp giữa người dùng.
- AI Assistant và AI-powered recommendations.
- Quản lý tài chính cá nhân.
- Calendar và lập lịch nâng cao.
- Gamification, hệ thống cấp độ và phần thưởng.
- Marketplace chia sẻ workspace hoặc template.
- Hệ thống mô phỏng vật lý hoặc gameplay.
- Môi trường VR/AR.
- Custom 3D Model Editor.

Các tính năng này có thể được xem xét trong những phiên bản tiếp theo nếu phù hợp với định hướng sản phẩm.

---

## 7. Product Principles

DevSpace cần tuân thủ các nguyên tắc sau trong quá trình phát triển:

### 7.1. 3D Must Have a Purpose

Mỗi thành phần 3D phải có ý nghĩa trong việc biểu diễn dữ liệu hoặc hỗ trợ tương tác.

Không sử dụng 3D chỉ để tạo hiệu ứng thị giác mà không mang lại giá trị sử dụng.

### 7.2. Functionality Over Visual Complexity

Ưu tiên khả năng sử dụng, tốc độ phản hồi và tính rõ ràng của thông tin trước độ phức tạp của hình ảnh 3D.

### 7.3. Clear Data Structure

Dữ liệu phải có cấu trúc rõ ràng, có thể quản lý độc lập với cách biểu diễn trong không gian 3D.

Việc thay đổi giao diện hoặc bố cục 3D không được làm thay đổi ý nghĩa nghiệp vụ của dữ liệu.

### 7.4. Progressive Complexity

Bắt đầu với các đối tượng và tương tác đơn giản.

Chỉ bổ sung các cơ chế trực quan hóa phức tạp khi chúng thực sự cần thiết.

### 7.5. Extensible by Design

Thiết kế MVP cần tạo điều kiện mở rộng thêm Knowledge, Goals, Timeline và các loại Relationship trong tương lai mà không phải xây dựng lại toàn bộ hệ thống.

---

## 8. Product Constraints and Assumptions

### 8.1. Constraints

- Phiên bản đầu tiên tập trung vào một người dùng cá nhân.
- Không gian 3D phải có khả năng hoạt động trên trình duyệt web.
- Các thao tác CRUD cần có giao diện 2D rõ ràng.
- Dữ liệu nghiệp vụ phải được lưu trữ độc lập với trạng thái render của Three.js.
- Trải nghiệm 3D cần cân nhắc hiệu năng và khả năng sử dụng trên các thiết bị có cấu hình khác nhau.

### 8.2. Assumptions

- Người dùng có kết nối Internet khi sử dụng các chức năng cần đồng bộ dữ liệu.
- Người dùng có thể sử dụng chuột và bàn phím để tương tác với môi trường 3D.
- Người dùng chấp nhận trải nghiệm không gian 3D như một cách tổ chức thông tin mới.
- MVP không yêu cầu mô hình 3D có độ chi tiết cao; các đối tượng có thể được xây dựng từ geometry và material cơ bản.

---

## 9. Future Possibilities

Sau khi hoàn thiện MVP, DevSpace có thể được mở rộng theo các hướng:

| Feature | Description |
|---|---|
| Knowledge Management | Quản lý ghi chú, tài liệu và kiến thức cá nhân |
| Goal Management | Thiết lập và theo dõi mục tiêu |
| Timeline | Trực quan hóa quá trình phát triển theo thời gian |
| Advanced Relationships | Biểu diễn các mối quan hệ phức tạp giữa kiến thức và dự án |
| Customization | Tùy chỉnh bố cục, hình dạng và phong cách không gian |
| AI Assistant | Hỗ trợ tìm kiếm, phân tích và tổ chức thông tin |
| Collaboration | Chia sẻ và cộng tác trong workspace |
| Import / Export | Nhập và xuất dữ liệu workspace |

Đây là định hướng mở rộng, không phải cam kết triển khai trong MVP.

---

## 10. Product Summary

DevSpace là một Personal 3D Knowledge Workspace, nơi người dùng tổ chức các lĩnh vực, dự án và thông tin cá nhân trong một môi trường 3D có khả năng tương tác.

Giá trị cốt lõi của sản phẩm không nằm ở việc tạo ra một thế giới 3D đẹp mắt, mà ở khả năng sử dụng không gian để giúp người dùng hiểu, tổ chức và khám phá dữ liệu của chính mình.

**MVP tập trung vào bốn thành phần cốt lõi:**

1. Workspace — Không gian làm việc cá nhân.
2. Areas — Các khu vực tổ chức thông tin.
3. Projects — Các dự án thuộc từng khu vực.
4. 3D Visualization — Trực quan hóa và tương tác với dữ liệu.

> **DevSpace: Organize your world. Visualize your progress.**
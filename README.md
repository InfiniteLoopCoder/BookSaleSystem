# 图书管理系统 (Library Management System)

一个现代化的全栈应用程序，用于管理图书馆的库存、销售、采购和财务。

## 项目概述

本系统是一个完整的图书管理解决方案，支持图书的库存管理、采购管理、销售管理和财务管理。系统设计满足小型到中型图书销售机构的需求，提供完善的用户权限管理、库存追踪和财务报表功能。

## 功能特点

### 用户管理
- 两种用户角色：超级管理员(Super Admin)和普通管理员(Admin)
- 超级管理员可以管理所有用户和系统功能
- 普通管理员可以管理图书、销售和采购
- 基于JWT的用户认证
- 使用pbkdf2_sha256加密存储密码，确保安全

### 图书管理
- 全面的图书库存跟踪
- 通过ISBN、标题、作者或出版商搜索图书
- 高级筛选和排序选项
- 图书信息编辑
- 库存不足警报

### 采购管理
- 完整的图书采购工作流
- 跟踪待处理、已付款和已收到的采购
- 当新书到达时无缝集成到库存中
- 对未付款订单的退货管理

### 销售管理
- 图书销售处理
- 销售时自动调整库存
- 销售历史记录跟踪
- 支持批量销售多本图书

### 财务管理
- 跟踪来自销售的收入和来自采购的支出
- 财务报告和分析
- 按日期范围筛选财务记录
- 财务概览的可视化图表

## 技术栈

### 后端
- Python 3.10+ 与 Flask 框架
- MySQL 数据库
- SQLAlchemy ORM 用于数据库交互
- Flask-JWT-Extended 用于认证
- RESTful API 架构

### 前端
- React 18
- Material-UI (MUI) 5 组件库
- Chart.js 用于数据可视化
- React Router 6 用于导航
- Formik & Yup 用于表单验证
- Axios 用于API通信

## 项目结构

```
library_management_system/
├── backend/                 # Python Flask 后端
│   ├── models/              # 数据库模型
│   │   └── models.py        # 数据模型定义
│   ├── routes/              # API路由
│   │   ├── auth.py          # 认证接口
│   │   ├── books.py         # 图书接口
│   │   ├── finance.py       # 财务接口
│   │   ├── purchases.py     # 采购接口
│   │   ├── sales.py         # 销售接口
│   │   └── users.py         # 用户接口
│   ├── app/                 # 应用核心
│   │   └── __init__.py      # 应用初始化
│   ├── init_db.py           # 数据库初始化
│   └── requirements.txt     # Python依赖
│
└── frontend/                # React前端
    ├── public/              # 静态资源
    └── src/
        ├── components/      # 可复用UI组件
        │   ├── layout/      # 布局组件
        │   └── common/      # 通用UI组件
        ├── context/         # React上下文(如认证)
        ├── pages/           # 页面组件
        │   ├── Books.js     # 图书列表页
        │   ├── Dashboard.js # 仪表板
        │   ├── Finance.js   # 财务管理
        │   ├── Login.js     # 登录页
        │   ├── Purchases.js # 采购管理
        │   ├── Sales.js     # 销售管理
        │   └── Users.js     # 用户管理
        ├── services/        # API服务
        │   ├── api.js       # 基础API配置
        │   ├── authService.js # 认证服务
        │   ├── bookService.js # 图书服务
        │   ├── financeService.js # 财务服务
        │   ├── purchaseService.js # 采购服务
        │   ├── saleService.js # 销售服务
        │   └── userService.js # 用户服务
        ├── utils/           # 工具函数
        ├── App.js           # 根组件
        └── index.js         # 应用入口
```

## 数据库设计

系统使用MySQL数据库，通过SQLAlchemy ORM进行数据模型定义。主要包含以下数据表：

### 用户表 (users)
```
- id: 整数，主键
- username: 字符串(80)，用户名，唯一
- password_hash: 字符串(128)，加密的密码
- real_name: 字符串(100)，真实姓名
- employee_id: 字符串(50)，员工ID，唯一
- gender: 字符串(10)，性别
- age: 整数，年龄
- role: 枚举，用户角色(SUPER_ADMIN或ADMIN)
- created_at: 日期时间，创建时间
- updated_at: 日期时间，更新时间
```

### 图书表 (books)
```
- id: 整数，主键
- isbn: 字符串(20)，ISBN编号，唯一
- title: 字符串(200)，书名
- author: 字符串(100)，作者
- publisher: 字符串(100)，出版商
- retail_price: 浮点数，零售价格
- stock_quantity: 整数，库存数量
- created_at: 日期时间，创建时间
- updated_at: 日期时间，更新时间
```

### 图书采购表 (book_purchases)
```
- id: 整数，主键
- isbn: 字符串(20)，ISBN编号
- title: 字符串(200)，书名
- author: 字符串(100)，作者
- publisher: 字符串(100)，出版商
- purchase_price: 浮点数，采购价格
- quantity: 整数，数量
- status: 枚举，状态(PENDING, PAID, CANCELLED, ADDED_TO_INVENTORY)
- user_id: 整数，外键关联users表
- created_at: 日期时间，创建时间
- updated_at: 日期时间，更新时间
```

### 图书销售表 (book_sales)
```
- id: 整数，主键
- book_id: 整数，外键关联books表
- quantity: 整数，数量
- unit_price: 浮点数，单价
- total_price: 浮点数，总价
- user_id: 整数，外键关联users表
- created_at: 日期时间，创建时间
```

### 财务交易表 (financial_transactions)
```
- id: 整数，主键
- transaction_type: 枚举，交易类型(INCOME或EXPENSE)
- description: 字符串(255)，描述
- amount: 浮点数，金额
- user_id: 整数，外键关联users表
- created_at: 日期时间，创建时间
```

## API文档

系统提供RESTful API，主要包含以下端点：

### 认证接口 (/api/auth)
- `POST /api/auth/login` - 用户登录
  - 请求体: `{ "username": "string", "password": "string" }`
  - 响应: `{ "token": "string", "user": { ... } }`
- `GET /api/auth/me` - 获取当前用户信息
  - 响应: `{ "id": number, "username": "string", ... }`
- `POST /api/auth/change-password` - 修改密码
  - 请求体: `{ "current_password": "string", "new_password": "string" }`
  - 响应: `{ "message": "Password updated successfully" }`

### 用户接口 (/api/users)
- `GET /api/users` - 获取所有用户(仅超级管理员)
- `GET /api/users/:id` - 获取单个用户信息
- `POST /api/users` - 创建新用户(仅超级管理员)
- `PUT /api/users/:id` - 更新用户信息
- `DELETE /api/users/:id` - 删除用户(仅超级管理员)
- `PUT /api/users/profile` - 更新当前用户个人资料
- `POST /api/users/:id/reset-password` - 重置用户密码(仅超级管理员)

### 图书接口 (/api/books)
- `GET /api/books` - 获取所有图书，支持筛选参数
- `GET /api/books/:id` - 获取单本图书详情
- `GET /api/books/search` - 搜索图书，使用q参数
- `POST /api/books` - 添加新图书
- `PUT /api/books/:id` - 更新图书信息
- `DELETE /api/books/:id` - 删除图书(仅超级管理员)

### 采购接口 (/api/purchases)
- `GET /api/purchases` - 获取所有采购记录，支持状态筛选
- `GET /api/purchases/:id` - 获取单个采购详情
- `POST /api/purchases` - 创建新采购订单
  - 支持单本或多本图书采购: `{ "books": [...] }`
- `POST /api/purchases/:id/pay` - 标记采购为已付款
- `POST /api/purchases/:id/cancel` - 取消采购
- `POST /api/purchases/:id/add-to-inventory` - 将采购的图书添加到库存

### 销售接口 (/api/sales)
- `GET /api/sales` - 获取所有销售记录
- `GET /api/sales/:id` - 获取单个销售详情
- `POST /api/sales` - 创建新销售
  - 支持单本或多本图书: `{ "items": [...] }`或`{ "book_id": number, "quantity": number }`

### 财务接口 (/api/finance)
- `GET /api/finance/transactions` - 获取所有财务交易，支持日期和类型筛选
- `GET /api/finance/summary` - 获取财务摘要（收入、支出、利润）

## 前端模块说明

### 认证与用户管理
- 登录页面 - 用户认证
- 用户管理页面 - 显示、创建、编辑和删除用户
- 用户档案页面 - 个人资料管理和密码修改

### 图书管理
- 图书列表页 - 显示所有图书，支持搜索和筛选
- 图书详情页 - 显示和编辑图书详细信息
- 添加图书页面 - 添加新图书到库存

### 采购管理
- 采购列表页 - 显示所有采购记录，按状态筛选
- 添加采购页面 - 创建新的采购订单
- 采购操作 - 支持支付、取消和添加到库存

### 销售管理
- 销售记录页 - 显示所有销售记录
- 新销售页面 - 创建销售交易
  - 支持多本图书一次性销售
  - 自动检查库存可用性

### 财务管理
- 财务概览 - 显示收入、支出和利润的摘要信息
- 交易历史 - 列出所有财务交易
- 图表可视化 - 显示财务趋势

## 起步指南

### 后端设置

1. 创建并激活虚拟环境:
   ```
   python -m venv venv
   source venv/bin/activate  # Windows下: venv\Scripts\activate
   ```

2. 安装依赖:
   ```
   cd backend
   pip install -r requirements.txt
   ```

3. 配置数据库:
   ```
   # 创建MySQL数据库'library_management'
   # 如需更改配置，请修改app/__init__.py中的DATABASE_URI
   ```

4. 初始化数据库:
   ```
   python init_db.py
   ```

5. 运行后端服务器:
   ```
   python app.py
   ```
   
### 前端设置

1. 安装依赖:
   ```
   cd frontend
   npm install
   ```

2. 启动开发服务器:
   ```
   npm start
   ```

3. 访问应用程序: http://localhost:3000

## 默认登录凭据

- 用户名: admin
- 密码: admin123

## 项目特性

### 用户认证与授权
- 基于JWT的认证
- 令牌过期和刷新机制
- 基于角色的路由授权

### 数据安全
- 密码使用pbkdf2_sha256算法加密
- API请求需要认证令牌
- 敏感操作需要适当的权限验证

### 用户体验
- 响应式设计，适配不同设备
- 实时表单验证
- 清晰的错误提示
- 数据可视化展示

### 业务逻辑
- 采购-库存-销售完整业务流程
- 财务交易自动记录
- 库存自动更新
- 低库存警告

## 许可证

本项目使用MIT许可证。 
# TypeScript 规范

> **TL;DR**: 启用 strict 模式。显式类型注解。避免 any，使用 unknown。接口用 PascalCase。优先使用类型推导，复杂类型显式声明。

---

## 配置要求

### tsconfig.json

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

## 类型定义

### 基本类型

```typescript
// ✅ 正确：显式类型
const name: string = 'John';
const age: number = 25;
const isActive: boolean = true;
const items: string[] = ['a', 'b'];
const tuple: [string, number] = ['id', 123];

// ✅ 类型推导（简单情况可省略）
const message = 'Hello'; // 推导为 string
const count = 0; // 推导为 number
```

### 函数类型

```typescript
// ✅ 显式参数和返回值类型
function getUser(id: string): Promise<User> {
  return fetchUser(id);
}

// ✅ 箭头函数
const calculateTotal = (price: number, quantity: number): number => {
  return price * quantity;
};

// ✅ 可选参数
function greet(name: string, title?: string): string {
  return title ? `${title} ${name}` : name;
}

// ✅ 默认参数
function paginate(page: number = 1, limit: number = 20): PaginatedResult {
  // ...
}
```

---

## 避免 any

### 使用 unknown

```typescript
// ❌ 不要使用 any
function processData(data: any) {
  return data.value; // 没有类型检查
}

// ✅ 使用 unknown + 类型守卫
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value;
  }
  throw new Error('Invalid data');
}

// ✅ 使用泛型
function processData<T extends { value: string }>(data: T) {
  return data.value; // 类型安全
}
```

### 类型断言

```typescript
// ❌ 避免 as any
const user = data as any;

// ✅ 使用具体类型
const user = data as User;

// ✅ 更好：使用类型守卫
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data
  );
}

if (isUser(data)) {
  console.log(data.name); // 类型安全
}
```

---

## Interface vs Type

### 使用 Interface

对象形状、类契约：

```typescript
// ✅ Interface 用于对象
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Interface 可扩展
interface Admin extends User {
  role: 'admin';
  permissions: string[];
}

// ✅ Interface 可合并
interface Product {
  id: string;
}

interface Product {
  title: string; // 自动合并
}
```

### 使用 Type

联合类型、工具类型：

```typescript
// ✅ Type 用于联合类型
type Status = 'pending' | 'active' | 'inactive';
type Result = Success | Error;

// ✅ Type 用于工具类型
type ReadonlyUser = Readonly<User>;
type PartialProduct = Partial<Product>;
type PickedKeys = Pick<User, 'id' | 'name'>;

// ✅ Type 用于映射类型
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};
```

---

## 泛型

### 基本泛型

```typescript
// ✅ 泛型函数
function identity<T>(value: T): T {
  return value;
}

const num = identity(123); // number
const str = identity('hello'); // string

// ✅ 泛型约束
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { id: '1', name: 'John' };
const name = getProperty(user, 'name'); // string
```

### API 响应泛型

```typescript
interface ApiResponse<T> {
  data: T;
  meta: {
    page: number;
    total: number;
  };
}

// 使用
const products: ApiResponse<Product[]> = await fetchProducts();
const user: ApiResponse<User> = await fetchUser();
```

---

## 常用工具类型

```typescript
// Partial - 所有属性可选
type PartialUser = Partial<User>;

// Required - 所有属性必需
type RequiredProduct = Required<Product>;

// Readonly - 所有属性只读
type ReadonlyUser = Readonly<User>;

// Pick - 选择部分属性
type UserPreview = Pick<User, 'id' | 'name'>;

// Omit - 排除部分属性
type UserWithoutEmail = Omit<User, 'email'>;

// Record - 键值对
type UserMap = Record<string, User>;

// Exclude - 从联合类型中排除
type NonAdmin = Exclude<Role, 'admin'>;

// Extract - 从联合类型中提取
type AdminOnly = Extract<Role, 'admin' | 'superadmin'>;
```

---

## Null 和 Undefined

```typescript
// ✅ 明确处理 null/undefined
function getUser(id: string): User | null {
  const user = findUser(id);
  return user ?? null;
}

// ✅ 可选链
const email = user?.profile?.email;

// ✅ 空值合并
const displayName = user.name ?? 'Anonymous';

// ✅ 类型守卫
if (user !== null) {
  console.log(user.name); // User 类型
}
```

---

## 枚举 vs 联合类型

### 使用联合类型（推荐）

```typescript
// ✅ 推荐：字符串字面量联合
type Platform = 'amazon' | 'walmart' | 'ebay' | 'aliexpress';
type Status = 'pending' | 'active' | 'inactive';

// 优点：轻量、类型安全、易于理解
```

### 使用枚举（特定场景）

```typescript
// ✅ 需要反向映射或命名空间时使用
enum HttpStatus {
  OK = 200,
  NotFound = 404,
  InternalError = 500,
}

const status: HttpStatus = HttpStatus.OK;
console.log(HttpStatus[200]); // "OK"
```

---

## 类型守卫

### 自定义类型守卫

```typescript
// ✅ 使用 is 关键字
function isProduct(item: unknown): item is Product {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    'title' in item &&
    'price' in item
  );
}

// 使用
if (isProduct(data)) {
  console.log(data.title); // data 是 Product 类型
}
```

### 内置类型守卫

```typescript
// typeof
if (typeof value === 'string') {
  console.log(value.toUpperCase());
}

// instanceof
if (error instanceof Error) {
  console.log(error.message);
}

// in
if ('email' in user) {
  console.log(user.email);
}
```

---

## 常见模式

### API 响应类型

```typescript
interface ApiSuccess<T> {
  data: T;
  status: 'success';
}

interface ApiError {
  error: string;
  message: string;
  status: 'error';
}

type ApiResponse<T> = ApiSuccess<T> | ApiError;

// 使用
function handleResponse<T>(response: ApiResponse<T>) {
  if (response.status === 'success') {
    return response.data; // T 类型
  } else {
    throw new Error(response.message);
  }
}
```

### 不可变数据

```typescript
// ✅ 使用 readonly
interface Config {
  readonly apiUrl: string;
  readonly timeout: number;
}

// ✅ 不可变数组
const items: readonly string[] = ['a', 'b', 'c'];
// items.push('d'); // 错误

// ✅ Readonly 工具类型
type ReadonlyConfig = Readonly<Config>;
```

---

## @ts-ignore 和 @ts-expect-error

```typescript
// ❌ 避免使用 @ts-ignore（隐藏错误）
// @ts-ignore
const x = unknownFunction();

// ✅ 使用 @ts-expect-error（测试中）
// @ts-expect-error - 测试错误处理
expect(() => parse('invalid')).toThrow();

// ✅ 最好：修复类型问题
const x = (unknownFunction as () => string)();
```

---

## 常见错误和解决方案

### 错误：Object is possibly 'null'

```typescript
// ❌ 问题
function getName(user: User | null) {
  return user.name; // 错误
}

// ✅ 解决：类型守卫
function getName(user: User | null) {
  if (user === null) {
    return 'Anonymous';
  }
  return user.name;
}

// ✅ 或使用可选链
function getName(user: User | null) {
  return user?.name ?? 'Anonymous';
}
```

### 错误：Type 'X' is not assignable to type 'Y'

```typescript
// ❌ 问题
const status: 'active' = someFunction(); // 返回 string

// ✅ 解决：类型断言
const status = someFunction() as 'active';

// ✅ 更好：修改函数返回类型
function someFunction(): 'active' | 'inactive' {
  return 'active';
}
```

---

## 参考资源

- [TypeScript 官方手册](https://www.typescriptlang.org/docs/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [后端代码约定](./backend-conventions.md)
- [前端代码约定](./frontend-conventions.md)

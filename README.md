# 아이템 시뮬레이터

간단한 아이템 시뮬레이터를 구현한 프로젝트입니다. 사용자 인증, 캐릭터 관리, 아이템 관리 기능을 포함하고 있으며, AWS EC2를 통해 배포되고 있습니다.

1. [프로젝트 관리](#프로젝트-관리)
2. [AWS EC2 배포](#aws-ec2-배포)
3. [인증 미들웨어 구현](#인증-미들웨어-구현)
4. [데이터베이스 모델링](#데이터베이스-모델링)
5. [필수 기능 구현](#필수-기능-구현)
6. [도전 기능 구현](#도전-기능-구현)
   
## 프로젝트 관리
1. `.env` 파일을 이용해 민감한 정보를 관리합니다 (DB 계정 정보, API Key 등).
2. `.gitignore` 파일을 생성하여 `.env` 파일과 `node_modules` 폴더가 GitHub에 올라가지 않도록 설정합니다.
3. `.prettierrc` 파일을 생성하여 일정한 코드 포맷팅을 유지합니다.

## AWS EC2 배포
- 프로젝트를 [**AWS EC2**](https://ap-northeast-2.console.aws.amazon.com/ec2)에 배포하였습니다.
- 배포된 IP 주소: `43.203.253.239` 또는 `umin2.shop`

## 인증 미들웨어 구현
- `/middlewares/auth.middleware.js`파일에 구현했습니다.
- JWT를 사용하여 사용자를 인증하는 미들웨어를 구현했습니다.
- Authorization 헤더를 통해 JWT를 전달받으며, 인증에 실패하는 경우 알맞은 HTTP Status Code와 에러 메세지를 반환합니다.
- 인증 성공 시, 사용자 정보를 `req.user`에 담고 다음 동작을 진행합니다.

## 데이터베이스 모델링
**유저(User), 캐릭터(Character), 아이템(Item), 인벤토리(CharacterItem), 장착 아이템(EquippedItem)** 5개의 주요 테이블로 구성되어 있습니다.
- 계정 테이블 : 유저 정보 관리
  - id: 유저의 고유 ID. 자동 증가.
  - username: 유저의 고유 사용자명. 소문자와 숫자로 이루어진 값. 3글자 이상 30글자 미만의 길이를 가지며, 유일한 값을 가진다.
  - password: 유저의 비밀번호. 6글자 이상의 문자열로 이루어진 값. 보안을 위해 해시 처리되어 저장된다.
  - name: 유저의 이름.
  - characters: 유저가 소유한 캐릭터 목록. 1:N 관계
    
- 캐릭터 테이블 : 유저가 생성한 각 캐릭터의 정보 관리
  - id: 캐릭터의 고유 ID. 자동 증가.
  - name: 캐릭터의 고유 이름. 유일한 값.
  - health: 캐릭터의 기본 체력. 기본값은 500.
  - power: 캐릭터의 기본 공격력. 기본값은 100.
  - money: 캐릭터의 초기 자금. 기본값은 10,000.
  - userId: 해당 캐릭터를 소유한 유저의 ID. 외래 키.
  - items: 캐릭터가 소유한 아이템 목록. CharacterItem 테이블을 통해 Item과의 관계를 나타냄.
  - equippedItems: 캐릭터가 장착한 아이템 목록. 1:N 관계.

- 아이템 테이블 : 아이템의 정보와 속성 관리
  - id: 아이템의 고유 ID. 자동 증가.
  - code: 아이템의 고유 코드. 유일한 값.
  - name: 아이템의 이름.
  - price: 아이템의 가격.
  - health: 아이템으로 증가하는 체력. 기본값은 0.
  - power: 아이템으로 증가하는 공격력. 기본값은 0.
  - characterItems: CharacterItem 테이블을 통해 Characte와의 관계를 나타냄.

- 인벤토리 테이블 : 캐릭터가 가진 아이템 정보 관리
  - characterId: 해당 인벤토리를 소유하는 캐릭터의 ID. 외래 키.
  - itemCode: 해당 아이템의 Code. 외래 키.
  - quantity: 해당 아이템의 수량.
    
- 장착 아이템 테이블
  - id: 장착 아이템 항목의 고유 ID. 자동 증가
  - characterId: 해당 아이템을 장착하고 있는 캐릭터의 ID. 외래 키.
  - itemCode: 장착하고 있는 아이템의 Code. 외래키
 
## 필수 기능 구현
## 회원가입 및 로그인 API
### 1. 회원가입 API (POST /users/sign-up)
자신의 아이디와 비밀번호를 서버의 user 테이블에 등록한다.

**요청 형식:**
```json
{
	"username": "spartaman",
	"password": "asdf4321",
	"confirmPassword": "asdf4321",
	"name": "스파르타맨"
}
```
- `username`: 로그인 할 때의 아이디. 다른 유저와 중복 불가능. 알파벳 소문자와 숫자로 이루어진 문자열.
- `password`: 로그인 할 때의 비밀번호. 최소 6글자 이상의 문자열.
- `confirmPassword`: 비밀번호 확인용 필드. password와 같아야 함.
- `name`: 유저의 이름.

**응답 형식:**
```json
{
	"message": "회원가입이 완료되었습니다.",
	"username": "spartaman",
	"name": "스파르타맨"
}
```
- `message`: 회원가입 성공 메시지.
- `username`: 회원가입된 유저의 아이디.
- `name`: 회원가입된 유저의 이름.

**실패 시 응답 예시**
```json
{
	"error": "이미 존재하는 사용자명입니다."
}
```
- `409 Conflict`: 입력된 사용자명이 이미 존재할 경우 발생하는 오류


**동작 설명**
1. 클라이언트는 사용자명, 비밀번호, 비밀번호 확인, 이름 정보를 POST 요청으로 보냄
2. Joi를 이용해 데이터의 유효성 검사
3. 사용자명이 이미 존재하면 `409 Conflict` 오류 발생
4. 데이터가 유효하면, 비밀번호는 `bcrypt`로 해시 처리되어 데이터베이스에 저장
5. 저장이 완료되면 성공 메시지와 함께 `username`,`name`을 반환

### 2. 로그인 API (POST /users/login)
자신의 아이디와 비밀번호로 로그인하여 토큰을 반환받는다.

**요청 형식:**
```json
{
	"username": "spartaman",
	"password": "asdf4321",
}
```
- `username`: 로그인 할 때의 아이디.
- `password`: 로그인 할 때의 비밀번호.

**응답 형식:**
```json
{
	"message": "로그인 성공",
	"token": "JWT 토큰"
}
```
- `message`: 로그인 성공 메시지.
- `token`: 인증이 필요한 API에서 사용되는 JWT 토큰.


**실패 시 응답 예시**
```json
{
	"error": "비밀번호가 일치하지 않습니다."
}
```
- `401 Unauthorized `: 입력된 비밀번호와 데이터베이스에 저장된 비밀번호가 다를 경우 발생하는 오류


**동작 설명**
1. 클라이언트는 사용자명, 비밀번호 정보를 POST 요청으로 보냄
2. Joi를 이용해 데이터의 유효성 검사
3. 사용자명이 데이터베이스에 존재하지 않으면 `401 Unauthorized` 오류 발생
4. 비밀번호가 다르면 `401 Unauthorized` 오류 발생
5. 사용자명과 비밀번호가 일치하면 JWT 토큰을 반환
6. 클라이언트는 이후 인증이 필요한 API 요청 시, authorization 헤더에 해당 토큰을 담아서 보냄

## 캐릭터 관리 API
### 3. 캐릭터 생성 API (POST /characters) (JWT 인증 필요)
캐릭터를 생성하여 서버의 character 데이터베이스에 저장합니다.

**요청 형식:**
```json
{
	"name": "character_name"
}
```
- `name`: 생성할 캐릭터의 이름. 다른 캐릭터와 중복 불가능.


**응답 형식:**
```json
{
	"message": "캐릭터 생성 성공",
	"characterId": 1
}
```
- `message`: 캐릭터 생성 성공 메시지.
- `characterId`: 생성된 캐릭터의 고유 ID.


**실패 시 응답 예시**
```json
{
	"error": "이미 존재하는 캐릭터 이름입니다."
}
```
- `400 Bad Request `: 입력된 캐릭터의 이름이 이미 존재할 경우 발생하는 오류

**동작 설명**
1. 클라이언트는 캐릭터 이름을 POST 요청으로 보냄
2. 인증 미들웨어를 이용해 로그인 정보의 유효성 검사
3. Joi를 이용해 캐릭터 이름의 유효성 검사
4. 중복된 캐릭터명이 있다면 `400 Bad Request ` 오류 발생
5. 캐릭터를 생성해 character 테이블에 저장
6. 성공 메세지와 캐릭터의 ID 반환

### 4. 캐릭터 삭제 API (DELETE /characters/:characterId) (JWT 인증 필요)
요청한 캐릭터를 데이터베이스에서 삭제한다.

**요청 파라미터**
- `characterId`: 삭제할 캐릭터의 고유 ID

**응답 형식**
```json
{
	"message": "캐릭터 삭제 성공"
}
```

**실패 시 응답 예시**
```json
{
	"error": "캐릭터를 찾을 수 없습니다."
}
```
- `404 Not Fount`: 입력된 ID를 가진 캐릭터가 데이터베이스에 존재하지 않을 경우 발생하는 오류

**동작 설명**
1. 클라이언트는 캐릭터 ID를 DELETE 요청으로 보냄
2. 인증 미들웨어를 이용해 로그인 정보의 유효성 검사
3. 캐릭터 인증 미들웨어를 이용해 파라미터 값으로 캐릭터 검색
4. 캐릭터 인증 미들웨어를 이용해 인증된 사용자가 해당 캐릭터의 소유자인지 확인
5. 소유자가 맞다면 캐릭터를 데이터베이스에서 삭제
6. 성공 메시지 반환

### 5-1. 캐릭터 목록 조회 API (GET /characters) (JWT 인증 필요)
사용자의 캐릭터 목록을 조회하는 API

**응답 형식**
```json
[
  {
    "id": 1,
    "name": "character_name",
    "health": 500,
    "power": 100
  },
  ...
]
```
- `id`: 캐릭터의 고유 ID
- `name`: 캐릭터의 이름
- `health`: 캐릭터의 체력
- `power`: 캐릭터의 공격력

**동작 설명**
1. 클라이언트는 GET 요청을 보냄
2. 인증 미들웨어를 이용해 로그인 정보의 유효성 검사
3. 인증된 사용자의 ID와 일치하는 캐릭터 목록 반환
4. 각 캐릭터의 id, name, health, power 정보를 포함한 목록 반환

### 5-2. 캐릭터 상세 조회 API (GET /characters/:characterId)
캐릭터의 상세 정보를 조회하는 API
캐릭터의 소유자만 캐릭터의 money 정보 확인 사능

**요청 파라미터**
- `characterId`: 조회할 캐릭터의 ID

**응답 형식**
- 자신의 캐릭터를 조회할 경우
```json
{
  "name": "character_name",
  "health": 500,
  "power": 100,
  "money": 10000
}
```
- 다른 유저의 캐릭터를 조회하거나 로그인하지 않은 사용자가 조회할 경우
```json
{
  "name": "character_name",
  "health": 500,
  "power": 100,
}
```

**동작 설명**
1. 클라이언트는 캐릭터 ID를 GET 요청으로 보냄
2. 헤더에 authorization필드가 존재한다면 인증 미들웨어를 이용해 로그인 정보의 유효성 검사
3. 캐릭터 ID로 캐릭터 검색
4. 로그인된 사용자가 자신의 캐릭터를 조회했을 경우, `money`도 포함된 응답 반환
5. 그렇지 않은 경우, `money` 없이 캐릭터 정보만 반환

## 아이템 관리 API
### 6. 아이템 생성 API (POST /items)
아이템의 정보를 수정하는 API. 가격(price)는 수정이 불가능하다.
**요청 형식**
```json
{
  "code": "item_code",
  "name": "item_name",
  "stat": {
    "health": 100,
    "power": 50
  },
  "price": 1000
}
```
- `code`: 아이템의 고유한 코드
- `name`: 아이템의 이름
- `stat`: 아이템의 능력치 (`heath`: 체력, `power`: 공격력)
- `price`: 아이템의 가격

**응답 형식**
```json
{
  "message": "아이템 생성 성공",
  "item": {
    "code": "item_code",
    "name": "item_name",
    "health": 100,
    "power": 50,
    "price": 1000
  }
}
```
-`item`: 생성된 아이템의 상세 정보

**실패 시 응답 예시**
```json
{
  "message": "이미 존재하는 아이템 코드입니다."
}
```
-`400 Bad Request`: 입력된 아이템 코드가 이미 존재할 경우 발생하는 오류

**동작 설명**
1. 클라이언트는 아이템 정보를 POST 요청으로 보냄
2. 서버는 데이터를 Joi로 유효성 검사
3. 데이터베이스에 중복된 입력된 코드가 존재하는지 확인
4. 아이템을 데이터베이스의 item 테이블에 저장
5. 생성된 아이템의 정보를 반환

### 7. 아이템 수정 API (PUT /items/:itemCode)
**요청 형식**
```json
{
  "name": "new_item_name",
  "stat": {
    "health": 200,
    "power": 70
  }
}
```
- `name`: 아이템의 이름
- `stat`: 아이템의 능력치 (`heath`: 체력, `power`: 공격력)

**요청 파라미터**
`itemCode`: 수정할 아이템의 Code

**응답 형식**
```json
{
  "message": "아이템 수정 성공",
  "item": {
    "code": "item_code",
    "name": "new_item_name",
    "health": 200,
    "power": 70,
    "price": 1000
  }
}

```
-`item`: 수정된 아이템의 상세 정보

**실패 시 응답 예시**
```json
{
  "message": "아이템을 찾을 수 없습니다."
}
```
-`404 Bad Request`: 입력된 아이템 코드가 데이터베이스에 존재하지 않을 경우 발생하는 오류

**동작 설명**
1. 클라이언트는 아이템 ID와 수정할 아이템의 상세 정보를 PUT 요청으로 보냄
2. 서버는 데이터를 Joi로 유효성 검사
3. 입력된 아이템 코드로 아이템 조회
4. 해당 아이템 정보를 입력된 정보로 수정
5. 가격은 수정할 수 없음
6. 수정된 아이템의 정보를 반환

### 8. 아이템 목록 조회 API (GET /items)
모든 아이템의 목록을 조회하는 API

**응답 형식**
```json
[
  {
    "code": "item_code_1",
    "name": "item_name_1",
    "price": 1000
  },
  {
    "code": "item_code_2",
    "name": "item_name_2",
    "price": 1500
  }
]
```

**동작 설명**
1. 클라이언트는 GET 요청을 보냄
2. 서버는 모든 아이템의 `code`, `name`, `price` 정보를 반환

### 9. 아이템 상세 조회 API (GET /items/:itemCode)

**요청 파라미터**
- `itemCode`: 조회할 아이템의 Code

**응답 형식**
```json
{
  "code": "item_code",
  "name": "item_name",
  "price": 1000
}

```

**동작 설명**
1. 클라이언트는 아이템Code를 GET 요청으로 보냄
2. 서버는 데이터를 Joi로 유효성 검사
3. 서버는 itemCode를 이용해 해당 아이템을 검색
4. 검색된 아이템의 `code`, `name`, `price`를 반환

## 도전 기능 구현

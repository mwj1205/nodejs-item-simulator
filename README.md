# nodejs-item-simulator

## item-simulator
플레이어의 캐릭터와 아이템을 확인하고, 아이템 구매/착용/해제를 구현하는 프로젝트

## db modeling
**유저(User), 캐릭터(Character), 아이템(Item), 인벤토리(CharacterItem), 장착 아이템(EquippedItem)** 5개의 주요 테이블로 구성되어있다.
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
  - itemId: 해당 아이템의 ID. 외래 키.
  - quantity: 해당 아이템의 수량.
    
- 장착 아이템 테이블
  - id: 장착 아이템 항목의 고유 ID. 자동 증가
  - characterId: 해당 아이템을 장착하고 있는 캐릭터의 ID. 외래 키.
  - itemId: 장착하고 있는 아이템의 ID. 외래키

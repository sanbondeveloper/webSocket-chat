## 웹 소켓

- HTML5에 새로 추가된 실시간 양방향 전송을 위한 기술
- WS 프로토콜 사용, 브라우저와 서버가 WS 프로토콜을 지원하면 사용 가능
- 최신 브라우저는 대부분 웹 소켓 지원, 노드에서는 ws, Socket.IO 등 패키지 사용
- HTTP 프로토콜과 포트를 공유

## 폴링(polling)

- 웹 소켓 이전, HTTP 기술을 사용해 실시간 데이터 전송을 구현
- 주기적으로 서버에 새로운 업데이트가 있는지 확인하는 방법

## 서버센트 이벤트(SSE)

- Event Source라는 객체 사용
- 서버가 클라이언트에 지속적으로 데이터를 보냄
- 굳이 양방향 통신이 필요가 없는 경우 활용

## Socket.IO

### 클라이언트 소켓 연결

- http 프로토콜 사용
- 서버의 path 옵션과 일치해야 통신 가능

```html
<script src="/socket.io/socket.io.js"></script>
<script>
  const socket = io.connect('http://localhost:8005', {
    path: '/socket.io',
    transports: ['websocket'],
  });
</script>
```

`/socket.io/socket.io.js`는 Socket.IO에서 클라이언트로 제공하는 스크립트(GET 요청을 한다고 생각하자)
Socket.IO는 먼저 폴링 방식으로 서버와 연결하고 웹 소켓을 사용할 수 있다면 웹 소켓으로 업그레이드한다.(HTTP 프로토콜을 사용하는 이유)
따라서, 웹 소켓을 지원하지 않는 브라우저는 폴링, 지원하는 브라우저는 웹 소켓 방식으로 사용 가능하다.
처음부터 웹 소켓 방식을 사용하고 싶다면 `transports: ['websocket']` 옵션을 추가한다.

### 네임스페이스

- `/room`부분을 네임스페이스라고 한다.

```javascript
const socket = io.connect('http://localhost:8005/room', {
  // 네임스페이스
  path: '/socket.io',
});
```

네임스페이스를 붙이면 서버에서 `/room` 네임스페이스를 통해 보낸 데이터만 받을 수 있다.
또한, 네임스페이스를 여러개 구분해 주고받을 데이터를 분류할 수 있다.

### 세션 아이디와 소켓 아이디

- 둘 다 고유한 값이다.
- 다만, 소켓 아이디는 변경될 수 있다.

```javascript
app.use((req, res, next) => {
  if (!req.session.color) {
    const colorHash = new ColorHash();
    req.session.color = colorHash.hex(req.sessionID);
    console.log(req.session.color, req.sessionID);
  }

  next();
});
```

매번 페이지를 이동할 때마다 소켓 연결이 해제되고 다시 연결되면서 소켓 아이디가 변경된다. 따라서 세션 아이디를 사용한다.
`colorHash.hex`는 해시이므로 같은 세션 아이디는 항상 같은 색상 문자열로 바뀐다. 단, 사용자가 많아질 경우 중복이 발생할 수 있다.

### `of` 메서드

- 네임스페이스를 부여하는 메서드

```javascript
const room = io.of('/room');
const chat = io.of('/chat');
```

Socket.IO는 기본적으로 `/` 네임스페이스에 접속
`of` 메서드를 통해 다른 네임스페이스를 만들어 접속할 수 있다.
네임스페이스를 구분했으므로 지정된 네임스페이스에 연결한 클라이언트에게만 데이터를 전달

### 방(room)

- 네임스페이스보다 더 세부적인 개념

```javascript
socket.on('join', (data) => {
  socket.join(data);
});
```

같은 네임스페이스 안에서도 같은 방에 들어있는 소켓끼리만 데이터를 주고 받을 수 있다.
`socket.join(방 ID)`를 통해 입장할 수 있고 `socket.leave(방 ID)`를 통해 나갈 수 있다.
연결이 끊기면(disconnect) 자동으로 방에서 나가지긴 한다.

### 방(room) 목록과 방(room)에 들어있는 소켓의 수

- 네임스페이스 내부의 방의 수
- 방에 포함되어 있는 소켓의 수

```javascript
const io = req.app.get('io');
const { rooms } = io.of('/chat').adapter;

if (room.max <= rooms.get(req.params.id)?.size) {
  return res.redirect('/error?허용 인원을 초과했습니다.');
}
```

### 미들웨어

- Socket.IO도 미들웨어 사용 가능

```javascript
const wrap = (middleware) => (socket, next) =>
  middleware(socket.request, {}, next);
chat.use(wrap(sessionMiddleware));
```

`express-session`미들웨어랑 연결하면 `socket.request.session`으로 세션에 접근할 수 있다.

### 특정인에게 메시지 보내기

```javascript
socket.to(소켓 ID).emit(이벤트, 데이터)
```

### 나를 제외한 전체에게 메시지 보내기

```javascript
socket.broadcast.emit(이벤트, 데이터);
socket.broadcast.to(방 ID).emit(이벤트, 데이터);
```

Node.js 교과서 개정 3판(조현영) 12강 내용 정리

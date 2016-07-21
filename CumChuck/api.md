CumChuck API 문서
================

이 문서에서는 CumChuck의 API에 대해 다룹니다.

인증
==
CumChuck은 API기반 oauth 토큰 기반 인증을 사용합니다.

클라이언트가 페이스북, 트위터(구현중) api를 이용해 로그인하게 되면 클라이언트에 저장된 토큰을 서버로 보냅니다.
서버는 그 토큰이 유효한지 아닌지를 검사해 서버에 저장된 유저정보를 반환합니다.

API 토큰은 클라이언트가 저장하고 있어야 하며 외부에서 접근 가능하면 안됩니다.

CumChuck은 서비스 내의 로그인을 지원하지 않습니다. 페이스북과 트위터 인증만 사용.
(이거 역시 미정)

인증방법
------
클라이언트가 자격 증명을 얻기위해 사용가능한 인증 방법에 대해 서술합니다.

##Facebook 로그인

[서버 API](https://github.com/ghaiklor/passport-facebook-token)

[클라이언트 API](https://developers.facebook.com/docs/facebook-login/android/v2.3)

페이스북 로그인이 클라이언트 상에서 처리되면 클라이언트는 서버의 '/auth/facebook/token' 으로 'access_token'에 AccessToken을 담은 POST 요청을 보냅니다.

서버는 인증이 실패했는지 성공했는지 판단후 그에 맞는 코드를 보냅니다.
OAuth 표준 인증 방법을 사용합니다.

##Twitter 로그인
[서버 API](https://github.com/ghaiklor/passport-twitter-token)

[클라이언트 API](https://https://fabric.io/kits/android/twitterkit)

음 이거 맞나

API 인증
----
구현중

데이터베이스 스키마
==============

CumChuck에 사용되는 데이터베이스 스키마입니다.

User
-----

사용자 하나를 의미합니다.
이는 사용자가 CumChuck 서비스에 처음 로그인했을때 동시에 생성됩니다.

##id

유저의 고유 식별번호 입니다. String

##name

유저의 페이스북 가입 명입니다. 트위터는 id로 할지 displayName으로 할지 생각중.

String

##profile

유저의 페이스북 프로필 사진입니다. 사용자의 사진에 관한 url과 기본사진 여부가 담겨 있습니다. Object

##gender

사용자의 성별입니다. String

##api

유저의 api 키입니다. String

Review
------

사용자들이 작성한 레스토랑에 대한 리뷰입니다.
리뷰 1개는 레스토랑 1개에 귀속됩니다.

##_id

리뷰의 고유 번호입니다. String

##writer

리뷰를 작성한 사람입니다. String

##picture_src

리뷰에 첨부된 사진의 url경로입니다. Array

##restrauntId

리뷰를 작성한 음식점의 ID값입니다. String

##reviewScore

리뷰에 매겨진 별점의 점수입니다. 소수점이 붙어있으므로 String

##reviewTitle

리뷰의 제목입니다. String

##reviewContent

리뷰의 내용입니다. String

##uploadDate

리뷰의 업로드 날짜입니다. Date

Room
------

사용자가 생성한 레이드의 정보입니다.

##host

방의 생성자의 정보입니다. JSON 오브젝트 형태로 반환됩니다.


##member

방에 참가되어있는 회원의 정보입니다. Array 안에 JSON 오브젝트 형태로 반환됩니다.

##id

방에 귀속된 음식점의 고유 id입니다. Foursquare API로 조회가 가능합니다.

##raidName

방의 제목입니다. String

##date

레이드가 이루어지는 일시입니다. Number

##member_limit

레이드 참가 가능 최대 인원의 제한수 입니다. Number

로그인
------

### /auth/facebook/token

입력된 Facebook access token으로 로그인을 실행합니다.

####입력

-access_token - 클라이언트에 저장된 Facebook의 access token입니다.

####출력

#####로그인 성공

{
	"유저 정보" : 어쩌구
}

#####로그인 실패

HTTP 401

### /api/auth/logout

토큰을 통해 로그아웃합니다. 토큰은 무효화됩니다.

####출력

HTTP 200

### /api/twitter/token

입력된 Twitter access token으로 로그인을 실행합니다.

####입력

-access_token - 클라이언트에 저장된 Twitter의 access token입니다.

####출력

#####로그인 성공

{
	"유저 정보" : 어쩌구저쩌구 지랄지랄 뷁
}

#####로그인 실패

HTTP 401

### /room/방번호

방번호로 들어갑니다. 만약 방이 없을 경우 새로 생성합니다.

####입력

-room(방번호) -방의 번호입니다.

####출력

#####방 생성 성공 및 입장 성공

{
	"방 정보" : room 스키마 정보
}


### /room/방번호/host

방 번호에 해당하는 방의 생성인을 알려줍니다.

####입력

-room(방번호) - 방의 번호 입니다.

####출력

#####방 호스트 정보 가져오기 성공시

{
	호스트 정보 출력 user 스키마와 동일(아마도)
}

#####방 호스트 정보 가져오기 실패

HTTP 404

### /room/방번호/member

방 번호에 해당하는 방의 인원을 알려줍니다.

####입력

-room(방번호) - 방의 번호입니다.

####출력

#####성공

방 참가 인원을 담은 Array 출력

#####실패

HTTP 404

###/room/list

현재 존재하는 방의 목록을 Array 형태로 출력합니다.

####입력

없음

####출력

[{},{},...]
첫번째 방 정보는 null로 출력됩니다.

###/search/장소/검색쿼리

입력한 장소값에 대한 쿼리의 결과를 출력합니다.

####입력

-l(장소) - 검색하고자 하는 곳의 범위입니다. 로케이션 파라미터값은 구단위, 시단위로 보내야 합니다.

예를 들면 구단위의 경우 : 서초구, 서울특별시, 대한민국 의 포맷으로 보내야 하며,

시단위의 경우 : 서울특별시, 대한민국 의 포맷으로 보내면 됩니다.

-query(검색쿼리) : 자신이 검색하고자 하는 음식점의 종류입니다. 예를들면 맥도날드, 치킨, 한식 같은 식으로.

#####성공

[
	{},
	{},
	{}
	....
]

object 안에는 음식점의 정보들이 담겨있습니다.

#####실패

HTTP 404

###/search/photos/음식점id

id에 해당하는 음식점 값의 사진의 결과들을 출력합니다.
이는 썸네일로 쓰입니다.

####입력

-음식점id - /search/장소/검색쿼리 를 통해 반환받은 음식점들 중 해당하는 음식점의 id 값입니다.

#####성공

[
	{},
	{},
	{}
]

object 안에는 음식점 사진들이 url형태로 반환됩니다.

#####실패

HTTP 404


###/register/review

제시한 음식점에 대한 리뷰를 작성합니다

####입력

-음식점id - 'restId'파라미터를 통해 전송합니다.

-작성자 - 'writer' 파라미터를 통해 전송합니다.

-별점 - 'score' 파라미터를 통해 전송합니다.

-제목 - 'title' 파라미터를 통해 전송합니다.

-내용 - 'content' 파라미터를 통해 전송합니다.

-사진 - 'files' 일반적인 http 파일 전송과 동일합니다.

####출력

#####성공

{
    review 스키마 안의 내용
}

#####실패

HTTP 404

###/review/average

제시한 음식점에 대한 평균 별점을 반환합니다

####입력

-음식점 id : 'restId'를 통해 입력합니다

####출력

#####성공

{
    average : 어쩌구
}

#####실패

HTTP 404

###/review/list

제시한 음식점에 대한 모든 게시물을 반환합니다

####입력

-음식점 id : 'restId'를 통해 입력합니다

####출력

#####성공

{
    {},
    {},
    {},
}

#####실패

HTTP 404


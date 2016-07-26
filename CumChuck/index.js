var express = require('express');
var mongoose = require('mongoose');
var serveStatic = require('serve-static');
var socket = require('socket.io');
var app = express();
var server = require('http').Server(app);
var https = require('https');
var bodyParser = require('body-parser');
var randomString = require('randomstring');
app.use(bodyParser.urlencoded({
    extended: true
}));
var cookieParser = require('cookie-parser');
var cookie = require('cookie');
app.use(cookieParser());
var session = require('express-session');
var sessionStore = require('sessionstore');
var multer = require('multer');
var fs = require('fs');
var io = socket.listen(server);
store = sessionStore.createSessionStore();
app.use(serveStatic(__dirname, ({
    'index': false
})));
app.use(session({
    store: store,
    secret: 'cumchuck',
    cookie: {
        path: '/',
        expires: false
    }
}));
var upload = multer({
    dest: './uploads/',
    rename: function (fieldname, filename) {
        return 'reviewFiles_' + filename;
    }
});
var schema = mongoose.Schema;

var reviewSchema = new schema({
    _id: {
        type: String
    },
    writer: {
        type: String
    },
    picture_src: {
        type: Array
    },
    user_id: {
        type: String
    },
    restrauntId: {
        type: String
    },
    reviewScore: {
        type: Number
    },
    reviewTitle: {
        type: String
    },
    reviewContent: {
        type: String
    },
    uploadDate: {
        type: Date
    },
    reviewRate: {
        type: Number
    }
});
var userSchema = new schema({
    id: {
        type: String
    },
    name: {
        type: String
    },
    profile: {
        type: Object
    },
    gender: {
        type: String
    },
    api: {
        type: String
    },
    exp: {
        type: Number
    },
    level: {
        type: Number
    },
    favorite: {
        type: Array
    }

});

var restrauntSchema = new schema({
    resId: {
        type: String
    },
    average: {
        type: String
    },
    photo: {
        type: Object
    },
    resTitle : {
        type : String
    },
    resAddress : {
        type : String
    }
});

var User = mongoose.model('user', userSchema);
var Restraunt = mongoose.model('rests', restrauntSchema);
var Review = mongoose.model('review', reviewSchema);

var count = 0;
var rooms = [];
var member;
var foursquare_client_id = 'DTIQQ0FSW3O3FQWTTSHCMJJS5LEXUSRKQR1LF44SVASL50TR';
var foursquare_client_secret = 'OUBPASPDS3BXACVJJUXZGBOVJFCW3WR5WHGDRRU0GSRYJRUX';
var host = 'api.foursquare.com';
var port = 443;

var foursquare = require('node-foursquare-venues')(foursquare_client_id, foursquare_client_secret);

function Room() {
    this.host = "";
    this.member = [];
    this.id = 0;
    this.title = "";
    this.content = "";
    this.resId = "";
    this.date = 0;
    this.raidMax = 0;
    this.raidPhoto;
    this.commit = false;
    this.resTitle;
    this.resAddress;
}

server.listen(8000);
console.log("Server Running At Port 8000");
require('./oauth')(app, User);
app.get('/', function (req, res) {
    res.send(req.session.passport.user._raw);
    console.log(req.session.passport.user.permissions)
});


app.get('/login', function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

app.post('/raid/getRaidInfo', function (req, res) {
    if (rooms[req.param('raidId')] == undefined) {
        res.send(400, "Failed");
    }
    else if (rooms[req.param('raidId')] != undefined) {
        res.send(200, rooms[req.param('raidId')]);
    }
})

app.post('/raid/admin/commitRaid', function (req, res) {
    var temp_room;
    temp_room = rooms[req.param('raidId')];
    console.log("Temp Room : " + temp_room);
    if (temp_room.host == req.param('userId')) {
        rooms[req.param('raidId')].commit = true;
        res.send(200, rooms[req.param('raidId')]);
    }
    else if (temp_room.host != req.param('userId')) {
        res.send(400, "Access Denied");
    }
    else if (temp_room.commit != false) {
        res.send(401, "Already Committed");
    }
});

app.post('/raid/admin/destroyRaid', function (req, res) {
    var temp_room;
    temp_room = rooms[req.param('raidId')];
    console.log("Temp Room : " + temp_room);
    if (temp_room.host == req.param('userId')) {
        rooms.pop(rooms[req.param('raidId')]);
        res.send(200, rooms);
    }
    else if (temp_room.host != req.param('userId')) {
        res.send(400, "Access Denied");
    }
})

app.post('/raid/admin/newRaid', function (req, res) {
    var host_chk = false;
    for (var i=0; i<rooms.length; i++){
        if(rooms[i].host == req.param('hostId')){
            host_chk = true;
        }
    }
    console.log("Host Chk : "+host_chk);
    if (rooms[req.param('raidId')] == undefined && host_chk==false) {
        room = new Room();
        rest = new Restraunt();
        Restraunt.find({resId : req.param('resId')}, function (err, result) {
            if(err){
                console.log(err);
                throw err;
            }
            console.log(result);
            room.id = req.param('raidId');
            room.resId = req.param('resId');
            room.host = req.param('hostId');
            room.content = req.param('content');
            room.title = req.param('title');
            room.raidMax = req.param('raidMax');
            room.date = new Date();
            if(result[0].photo != undefined){
                room.raidPhoto = result[0].photo.prefix +result[0].photo.width+'x'+result[0].photo.height+ result[0].photo.suffix;
            }
            else{
                room.raidPhoto = "";
            }
            room.resAddress = result[0].resAddress;
            room.resTitle = result[0].resTitle;
            rooms.push(room);
            res.send(200, room);
        });
    }
    else if (rooms[req.param('raidId')] != undefined) {
        res.send(400, "Failed");
    }
    else if(host_chk == true){
        res.send(406, "You Already Have Raid!");
    }
});

app.post('/raid/length', function (req, res) {
    res.send(200, rooms.length);
})

app.post('/raid/admin/addUser', function (req, res) {
    var temp_room;
    temp_room = rooms[req.param('raidId')];
    console.log("temp Room : " + temp_room);
    if (temp_room.host == req.param('userId') && temp_room.commit == false) {
        rooms[req.param('raidId')].member.push(req.param('targetId'));
        res.send(200, rooms[req.param('raidId')].member);
    }
    else if (temp_room.host != req.param('userId')) {
        res.send(400, "Access Denied");
    }
    else if (temp_room.commit != false) {
        res.send(401, "Already Committed");
    }
});

app.post('/raid/admin/removeUser', function (req, res) {
    var temp_room;
    temp_room = rooms[req.param('raidId')];
    console.log("temp Room : " + temp_room);
    if (temp_room.host == req.param('userId') && temp_room.commit == false) {
        rooms[req.param('raidId')].member.pop(req.param('targetId'));
        res.send(200, rooms[req.param('raidId')].member);
    }
    else if (temp_room.host != req.param('userId')) {
        res.send(400, "Access Denied");
    }
    else if (temp_room.commit != false) {
        res.send(401, "Already Committed");
    }
});

app.post('/raid/self/joinRaid', function (req, res) {
    if (rooms[req.param('raidId')] != undefined && rooms[req.param('raidId')].commit == false) {
        rooms[req.param('raidId')].member.push(req.param('userId'));
        res.send(200, rooms[req.param('raidId')].member);
    }
    else if (rooms[req.param('raidId')] == undefined) {
        res.send(400, "failed");
    }
    else if (rooms[req.param('raidId')].commit != false) {
        res.send(401, "Already Committed");
    }
})

app.post('/raid/self/escapeRaid', function (req, res) {
    if (rooms[req.param('raidId')] != undefined) {
        rooms[req.param('raidId')].member.pop(req.param('userId'));
        res.send(200, rooms[req.param('raidId')].member);
    }
    else if (rooms[req.param('raidId')] == undefined) {
        res.send(400, 'Failed');
    }
    else if (rooms[req.param('raidId')].commit != false) {
        res.send(401, "Already Committed");
    }
});

app.post('/user/getSelfRaidStatus', function (req, res) {
    var myRaid = [];
    for (var i = 0; i < rooms.length; i++) {
        if (rooms[i].host == req.param('userId')) {
            myRaid.push(rooms[i]);
        }
        else {
            continue;
        }
    }
    if (myRaid.length != 0) {
        res.send(200, myRaid);
    }
    else {
        res.send(403, "Nothing");
    }
})


app.post('/raid/friendRaidList', function (req, res) {
    res.send(rooms, 200);
    if (rooms == null) {
        res.send(400);
    }
});

app.get('/search/:l/:query', function (req, res) {
    var query_param = req.params.query;
    var location_param = req.params.l;
    //로케이션 파라미터값은 구단위, 시단위로 보내야함
    //예를 들면 구단위의 경우, 서초구, 서울특별시, 대한민국의 포맷으로 보내야 하며,
    //시단위의 경우 서울특별시, 대한민국의 포맷으로 보내면 됨.
    foursquare.venues.search({near: location_param, query: query_param}, function (err, result) {
        if (err) {
            res.send("Error", 404);
            console.log(err);
            throw err;
        }
        else {
            res.send(result.response.venues);
        }
    })
});

app.post('/search/photos/:id', function (req, res) {
    foursquare.venues.photos(req.params.id, function (err, result) {
        if (err) {
            res.send("Error", 404);
            console.log(err);
            throw err;
        }
        else {
            res.send(result, 200);
        }
    })
});

app.post('/user/selfReview/postArticle', upload.array('reviewFiles', 12), function (req, res) {
    var review = new Review();
    User.find({id: req.param('userId')}, function (err, result) {
        if (err) {
            throw err;
            console.log(err);
        }
        console.log(result);
        console.log("Writer : " + result[0].name);
        review._id = randomString.generate(15);
        review.writer = result[0].name;
        review.user_id = req.param('userId');
        console.log(req.param('userId'));
        review.uploadDate = new Date();
        review.restrauntId = req.param('resId');
        console.log(req.param('resId'));
        review.reviewScore = req.param('rating');
        console.log(req.param('rating'));
        review.picture_src = req.files;
        review.reviewTitle = req.param('reviewTitle');
        console.log(req.param('reviewTitle'));
        review.reviewContent = req.param('reviewContent');
        console.log(req.param('reviewContent'))
        if (review.reviewContent != null) {
            review.save(function (err, silence) {
                if (err) {
                    console.log(err);
                    throw err;
                }
                console.log(review);
            });
            console.log(review);
            res.send(200, review);
        }
    });
});


app.post('/user/selfReview/deleteArticle', function (req, res) {
    Review.find({_id: req.param('articleKey')}, function (err, result) {
        if (err) {
            // res.send(401, "failed");
            throw err;
            console.log(err);
        }
        else {
            res.send(200, result);
        }
    }).remove();
})

app.post('/user/selfReview/editArticle', function (req, res) {
    Review.update({_id: req.param('articleKey')},
        {
            reviewTitle: req.params('reviewTitle'),
            reviewCOntent: req.param('reviewContent'),
            reviewScore: req.param('rating')
        }, function (err, result) {
            if (err) {
                // res.send(401, "failed");
                throw err;
                console.log(err)
            }
            else {
                res.send(200, result);
            }
        });
});

app.post('/review/article/like', function (req, res) {
    var temp_rating;
    Review.find({_id: req.param('reviewKey')}, function (err, result) {
        if (err) {
            // res.send(401, "failed");
            throw err;
            console.log(err);
        }
        temp_rating = result[0].reviewRate;
        temp_rating++;
    });
    Review.update({_id: req.param('articleKey')}, {reviewRate: temp_rating}, function (err, result) {
        if (err) {
            // res.send(409, "Failed");
            throw err;
            console.log(err);
        }
        else {
            res.send(200, result);
        }
    })
});

app.post('/review/article/likeCancel', function (req, res) {
    var temp_rating;
    Review.find({_id: req.param('reviewKey')}, function (err, result) {
        if (err) {
            // res.send(409, "failed");
            throw err;
            console.log(err);
        }
        temp_rating = result[0].reviewRate;
        temp_rating--;
    });
    Review.update({_id: req.param('articleKey')}, {reviewRate: temp_rating}, function (err, result) {
        if (err) {
            // res.send(401, "Failed");
            throw err;
            console.log(err);
        }
        else {
            res.send(200, result);
        }
    });
});


app.get('/review/averageget', function (req, res) {
    var sum = 0;
    var average;
    Review.find({
        restrauntId: req.param('resId')
    }, function (err, result) {
        if (err) {
            res.send(400, "Failed");
            console.log(err);
            throw err;
        }
        else {
            for (var i = 0; i < result.length; i++) {
                sum += result[i].reviewScore;
                console.log(sum);
            }

            average = sum / result.length;
            console.log(average + ' : get');
            res.send(200, average);
        }
    })
})

app.post('/review/average', function (req, res) {
    var sum = 0;
    var average;
    Review.find({
        restrauntId: req.param('resId')
    }, function (err, result) {
        if (err) {
            res.send(400, "Failed");
            console.log(err);
            throw err;
        }
        else {
            for (var i = 0; i < result.length; i++) {
                sum += result[i].reviewScore;
                console.log(sum);
            }

            average = sum / result.length;
            console.log(average);
            res.send(200, average);
        }
    })
});

//즐찾
app.post('/user/favorite/addFavorite', function (req, res) {
        var favoriteArr=[];
        User.find({id: req.param('userId')}, function (err, result_find) {
            if (err) {
                throw err;
                console.log(err);
            }
            console.log(result_find);
            favoriteArr = result_find[0].favorite;
            favoriteArr.push(req.param('resId'));
            User.update({id: req.param('userId')}, {favorite: favoriteArr}, function (err, result) {
                if (err) {
                    throw err;
                    console.log(err);
                }
                else {
                    console.log(favoriteArr);
                    res.send(200, result);
                }
            });

        });
});

app.post('/user/favorite', function (req, res) {
    User.find({id: req.param('userId')}, function (err, result) {
        if (err) {
            throw err;
            console.log(err);
        }
        else {
            res.send(200, result[0].favorite);
        }

    })
});

app.post('/user/favorite/removeFavorite', function (req, res) {
    var favoriteArr = [];
    User.find({id: req.param('userId')}, function (err, result) {
        if (err) {
            res.send(400, "Failed");
            throw err;
            console.log(err);
        }
        favoriteArr = result[0].favorite;
    });
    favoriteArr.pop(req.param('resId'));
    User.update({id: req.param('userId')}, {favorite: req.param('resId')}, function (err, result) {
        if (err) {
            res.send(400, "Failed");
            throw err;
            console.log(err);
        }
        else {
            res.send(200, result);
        }
    })
});

app.post('/restaurant/info', function (req, res) {
    var average;
    var sum=0;
    var query = req.param('resId');
    var rest = new Restraunt();
    foursquare.venues.venue(query, function (err, result_venue) {
        if(err) {
            console.log(err);
            throw err;
        }
            else{
            Review.find({
                restrauntId: req.param('resId')
            }, function (err, result) {
                if (err) {
                    console.log(err);
                    throw err;
                }
                else {
                    for (var i = 0; i < result.length; i++) {
                        sum += result[i].reviewScore;
                        console.log(sum);
                    }
                    average = sum / result.length;
                    console.log(average + ' : get');
                }
            });
                Restraunt.find({resId : req.param('resId')}, function(err, result_find){
                    console.log(result_find);
                    if(err){
                        console.log(err);
                        throw err;
                    }
                    if(!result_find){
                        Restraunt.update({resId : req.param('resId')}, {average : average},function (err, result) {
                            if(err){
                                console.log(err);
                                throw err;
                            }
                            console.log(result);
                        })
                    }
                    if(result_find){
                        rest.resId = req.param('resId');
                        rest.average = average;
                        rest.photo = result_venue.response.venue.bestPhoto;
                        rest.resTitle = result_venue.response.venue.name;
                        rest.resAddress = result_venue.response.venue.location.address;
                        rest.save(function (err, silence) {
                            if(err){
                                console.log(err);
                                throw err;
                            }
                            res.send(200, rest);
                        })
                    }
                })
            }
        });
    });


app.post('/review/list', function (req, res) {
    Review.find({
        restrauntId: req.param('resId')
    }, function (err, result) {
        if (err) {
            res.send(400, "Failed");
            console.log(err);
            throw err;
        }
        else {
            res.send(200, result);
        }
    })
});

app.post('/review/list/showArticle', function (req, res) {
    Review.find({
        _id: req.param('reviewId')
    }, function (err, result) {
        if (err) {
            res.send(400, "Failed");
            throw err;
            console.log(err);
        }
        else {
            res.send(200, result);
        }
    })
})

app.post('/user/selfReview', function (req, res) {
    Review.find({
        user_id: req.param('userId')
    }, function (err, re) {
        if (err) {
            res.send(400, "Failed");
            console.log(err);
            throw err;
        }
        else {
            res.send(200, re);
        }
    })
});

app.get('/user/addexp', function (req, res) {
    var temp_exp = 0;
    User.findOne({'id': req.params.id}, function (err, result) {
        if (err) {
            throw err;
            console.log(err);
        }
        console.log(result);
        temp_exp = result.exp;
    });
    console.log(temp_exp);
    User.update({'id': req.params.id}, {'exp': temp_exp + req.params.addexp}, function (err, result) {
        if (err) {
            throw err;
            console.log(err);
            res.send(err, 401);
        }
        else {
            console.log(result);
            res.send(result, 200);
        }
    });

});

// --------------------------------------------------
// Helper functions
// --------------------------------------------------
var player = function () {
    return Players.findOne(Session.get('player_id'));
};

var game = function () {
    var me = player();
    return me && me.game_id && Games.findOne(me.game_id);
};
var active_player = function () {
    return Players.findOne({_id: game().players[game().active_player]._id});
}

// --------------------------------------------------
// Lobby Template
// --------------------------------------------------
Template.lobby.show = function () {
    return !game();
};

Template.lobby.player_name = function () {
    var me = player();
    if (me && me.name != '') {
        return me.name;
    } else {
        return false;
    };
}

Template.lobby.waiting = function() {
    var players = Players.find({
        _id: {$ne: Session.get('player_id')},
        name: {$ne: ''},
        idle: false,
        game_id: null
    });

    return players;
}

Template.lobby.count = function() {
    var players = Template.lobby.waiting();
    return players.count();
}

Template.lobby.events = {
    'keyup input#playername': function(event) {
        var name = $('#lobby input#playername').val().trim();
        Players.update(Session.get('player_id'), {$set: {name: name}});
    },
    'click #start-single-player': function(event) {
        var me = player();
        if(me && me.name != '') {
            console.log('Starting single player game');
            var player1 = Session.get('player_id');
            Meteor.call('start_new_singleplayer_game', player1);

            Meteor.autosubscribe(function() {
                var me = player();
                if (me && me.game_id) {
                    Meteor.subscribe('games', me.game_id);
                };
            });
        }
    },
    'click #others li': function(event) {
        var me = player();
        if(me && me.name != '') {
            console.log('Starting game with ' + this.name);
            var player1 = Session.get('player_id');
            var player2 = this._id;
            Meteor.call('start_new_game', player1, player2);

            Meteor.autosubscribe(function() {
                var me = player();
                if (me && me.game_id) {
                    Meteor.subscribe('games', me.game_id);
                };
            });
        }
    }
};

// --------------------------------------------------
// Scoreboard Template
// --------------------------------------------------
Template.scoreboard.show = function () {
    return game();
};

Template.scoreboard.players = function() {
    var me = player();
    var players = Players.find({
        game_id: me.game_id 
    });
    return players;
}

// --------------------------------------------------
// Game Template
// --------------------------------------------------
Template.gamearea.show = function () {
    return game();
};

Template.gamearea.active_player = function () {
    return active_player().name;
};

Template.gamearea.is_active = function () {
    return active_player()._id == player()._id;
}

Template.gamearea.dice = function () {
    return game().dice || "Roll me!";
}

Template.gamearea.diceclass = function () {
    if (game().dice == 6) {
        return "red";
    } else {
        return "";
    };
}

Template.gamearea.sum = function () {
    return game().sum;
}

Template.gamearea.result = function() {
    if (game().winner) {
        if (game().winner == Session.get('player_id')) {
            return "You won!";
        } else {
            return '<iframe width="640" height="480" src="http://www.youtube.com/embed/oHg5SJYRHA0?autoplay=1" frameborder="0" allowfullscreen></iframe>';
        };
    } else {
        return false;
    };
}

Template.gamearea.events = {
    'click #roll, click #dice': function(e) {
        e.preventDefault();
        if (player()._id == active_player()._id) {
            Meteor.call('roll', game()._id, player()._id);
        };
    },
    'click #save': function(e) {
        e.preventDefault();
        if (player()._id == active_player()._id) {
            Meteor.call('save', game()._id, player()._id);
        };
    }
}

// --------------------------------------------------
// Startup
// --------------------------------------------------
Meteor.startup(function(){
    var player_id = Players.insert({name: '', idle: false, game_id: null});
    Session.set('player_id', player_id);

    Meteor.call('keepalive', Session.get('player_id'));

    Meteor.autosubscribe(function() {
        Meteor.subscribe('players');

        if(Session.get('player_id')) {
            var me = player();
            if (me && me.game_id) {
                Meteor.subscribe('games', me.game_id);
            };
        }
    });

    // send keepalives so the server can tell when we go away.
    //
    // XXX this is not a great idiom. meteor server does not yet have a
    // way to expose connection status to user code. Once it does, this
    // code can go away.
    Meteor.setInterval(function() {
        if (Meteor.status().connected)
        Meteor.call('keepalive', Session.get('player_id'));
    }, 20*1000);
});


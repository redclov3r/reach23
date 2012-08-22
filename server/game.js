var WINNING = 23;
Meteor.methods({
    start_new_game: function (player_1, player_2) {
        var game_id = Games.insert({dice: 0, sum: 0});

        Players.update(
            {game_id: null, name: {$ne: ''}, _id: {$in: [player_1, player_2]}},
            {$set: {game_id: game_id, points: 0}},
            {multi: true}
            );
        var p = Players.find({game_id: game_id}, {fields: {_id: true, name: true}}).fetch();
        Games.update({_id: game_id}, {$set: {players: p, active_player: 0}});
    },

    roll: function(game_id, player_id) {
        var game = Games.findOne(game_id);

        if (game.players[game.active_player]._id === player_id) {
            var roll = Math.ceil(Math.random() * 6);
            if (roll < 6 && (Players.findOne(player_id).points + game.sum + roll) <= WINNING) {
                var sum = game.sum + roll;
            } else {
                var sum = 0;
                Meteor.call('next_player', game_id);
            };
            Games.update(game_id, {$set: {'dice': roll, 'sum': sum}});
        };

    },

    save: function(game_id, player_id) {
        var game = Games.findOne(game_id);

        if (game.players[game.active_player]._id === player_id) {
            Players.update(player_id, {$inc: {'points': game.sum}})
            Games.update(game_id, {$set: {'sum': 0}});
            Meteor.call('next_player', game_id);

            var player = Players.findOne(player_id);
            if (player.points >= WINNING) {
                Games.update(game_id, {$set: {'winner': player_id}})
            };
        }
    },

    next_player: function(game_id) {
        var game = Games.findOne(game_id);
        var new_active_player = (game.active_player + 1) % game.players.length;
        Games.update(game_id, {$set: {'active_player': new_active_player}});
    },

    keepalive: function(player_id) {
        Players.update(
            {_id: player_id}, 
            {$set: {
                       last_keepalive: (new Date()).getTime(),
                       idle: false
                   }
            }
        )
    }
});

Meteor.setInterval(function () {
    var now = (new Date()).getTime();
    var idle_threshold = now - 70*1000; // 70 sec
    var remove_threshold = now - 5*60*1000; // 5 min

    Players.update({last_keepalive: {$lt: idle_threshold}},
        {$set: {idle: true}});

    // XXX need to deal with people coming back!
    Players.remove({last_keepalive: {$lt: remove_threshold}});

}, 10*1000);

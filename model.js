Games = new Meteor.Collection('games');
// { dice: 5, players: [{ player_id, name }], active_player: 0 }

Players = new Meteor.Collection('players');
// { name: 'john', game_id: 123, points: 42 }

if (Meteor.is_server) {
    Meteor.publish('players', function() {
        return Players.find();
    });
    Meteor.publish('games', function(id) {
        return Games.find({_id: id});
    });
};

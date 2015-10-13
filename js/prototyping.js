"use strict";

var game = {};
game.box;
game.boxAndGroundTouch = false;
game.ground;
game.keyboard = [];

var canvas;
var ctx;
var canvasWidth;
var canvasHeight;

function createWorld() {
    // set the size of the world
    var worldAABB = new b2AABB();
    worldAABB.minVertex.Set(-4000, -4000);
    worldAABB.maxVertex.Set(4000, 4000);
    
    // Define the gravity
    var gravity = new b2Vec2(0, 300);
    
    // set to ignore sleeping object
    var doSleep = false;
    
    // finally create the world with the size, gravity,
    // and sleep object parameter.
    var world = new b2World(worldAABB, gravity, doSleep);
    
    return world;
}

function createGround() {
    // box shape definition
    var groundSd = new b2BoxDef();
    groundSd.extents.Set(250, 25);
    groundSd.restitution = 0.0;
    
    // body definition with the given shape we just created.
    var groundBd = new b2BodyDef();
    groundBd.AddShape(groundSd);
    groundBd.position.Set(250, 370);
    var body = game.world.CreateBody(groundBd);
    
    return body;
}

function createBox() {
    var boxSd = new b2BoxDef();
    boxSd.density = 1.0;
    boxSd.friction = 1.5;
    boxSd.restitution = 0.0;
    boxSd.extents.Set(20, 20);
    
    var boxBd = new b2BodyDef();
    boxBd.AddShape(boxSd);
    boxBd.position.Set(50, 210);
    boxBd.preventRotation = true;
    return game.world.CreateBody(boxBd);
}

// drawing functions
function drawWorld(world, context) {
	for (var b = world.m_bodyList; b != null; b = b.m_next) {
		for (var s = b.GetShapeList(); s != null; s = s.GetNext()) {
			drawShape(s, context);
		}
	}
}

// drawShape function directly copy from draw_world.js in Box2dJS library
function drawShape(shape, context) {
	context.strokeStyle = '#003300';
	context.beginPath();
	switch (shape.m_type) {
	case b2Shape.e_circleShape:
		var circle = shape;
		var pos = circle.m_position;
		var r = circle.m_radius;
		var segments = 16.0;
		var theta = 0.0;
		var dtheta = 2.0 * Math.PI / segments;
		// draw circle
		context.moveTo(pos.x + r, pos.y);
		for (var i = 0; i < segments; i++) {
			var d = new b2Vec2(r * Math.cos(theta), r * Math.sin(theta));
			var v = b2Math.AddVV(pos, d);
			context.lineTo(v.x, v.y);
			theta += dtheta;
		}
		context.lineTo(pos.x + r, pos.y);

		// draw radius
		context.moveTo(pos.x, pos.y);
		var ax = circle.m_R.col1;
		var pos2 = new b2Vec2(pos.x + r * ax.x, pos.y + r * ax.y);
		context.lineTo(pos2.x, pos2.y);
		break;
	case b2Shape.e_polyShape:
		var poly = shape;
		var tV = b2Math.AddVV(poly.m_position, b2Math.b2MulMV(poly.m_R, poly.m_vertices[0]));
		context.moveTo(tV.x, tV.y);
		for (var i = 0; i < poly.m_vertexCount; i++) {
			var v = b2Math.AddVV(poly.m_position, b2Math.b2MulMV(poly.m_R, poly.m_vertices[i]));
			context.lineTo(v.x, v.y);
		}
		context.lineTo(tV.x, tV.y);
		break;
	}
	context.stroke();
}

function step() {
    game.world.Step(1.0/60, 1);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    drawWorld(game.world, ctx);
    checkCollisions();
    updateForcesAndApply();
    updateVelocityReadings();
    setTimeout(step, 10);
}

function updateVelocityReadings() {
    var velocity = game.box.GetLinearVelocity();
    console.log(velocity.x)
    $("#horizontal-velocity").html(velocity.x);
    $("#vertical-velocity").html(velocity.y);
}

function checkCollisions() {
    $("#status").html("no");
    var boxAndGroundTouch = false;
    for (var cn = game.world.GetContactList(); cn != null;
        cn = cn.GetNext())
    {
        var body1 = cn.GetShape1().GetBody();
        var body2 = cn.GetShape2().GetBody();
        if ((body1 == game.box && body2 == game.ground) ||
            (body2 == game.box && body1 == game.ground))
            $("#status").html("yes");
            boxAndGroundTouch = true;
    }
    game.boxAndGroundTouch = boxAndGroundTouch;
}

function updateForcesAndApply() {
    var force = {x : 0, y : 0};
    var velocity = game.box.GetLinearVelocity();
    var maximumHorizontalVelocity = 80;
    var sidewaysForceAmount = 1e7;
    var jumpForceAmount = 1e7;
    
    if (game.keyboard[37] && (velocity.x > -maximumHorizontalVelocity)) {
        // left arrow key
        force.x -= sidewaysForceAmount;
    }
    if (game.keyboard[38]) { 
        // up arrow key
        if (game.boxAndGroundTouch) {
            force.y -= jumpForceAmount;
        }
    }
    if (game.keyboard[39] && (velocity.x < maximumHorizontalVelocity)) {
        // right arrow key
        force.x += sidewaysForceAmount;
    }
    
    game.box.ApplyForce(new b2Vec2(force.x, force.y),
        game.box.GetCenterPosition());
    
    // Restrain velocity
    if (velocity.x > maximumHorizontalVelocity)
        velocity.x = maximumHorizontalVelocity;
    else if (velocity.x < -maximumHorizontalVelocity)
        velocity.x = -maximumHorizontalVelocity;
}

$(document).ready(function() {
    game.world = createWorld();
    game.ground = createGround();
    game.box = createBox();
    
    // get the reference of the context
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    canvasWidth = parseInt(canvas.width);
    canvasHeight = parseInt(canvas.height);
    
    drawWorld(game.world, ctx);
    
    // start advancing the step
    step();
    
    $(document).keydown(function(e) {
        if (e.which === 37 || e.which === 38 || e.which === 39) {
            game.keyboard[e.which] = true;
        }
    });
    $(document).keyup(function(e) {
        if (e.which === 37 || e.which === 38 || e.which === 39) {
            game.keyboard[e.which] = false;
        }
    });
});
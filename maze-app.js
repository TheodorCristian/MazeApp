const {World, Runner, Render, Engine, Bodies, Body, Events} = Matter;

const engine = Engine.create();
engine.world.gravity.y = 0;
const {world} = engine;

const cellsHorizontal = 4 * 2;
const cellsVertical = 3 * 2;
const width = window.innerWidth;
const height = window.innerHeight;
const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;   


const render = Render.create({
    element: document.querySelector('.maze-container'),
    engine: engine, 
    options: {
        width,
        height,
        wireframes: false,
    }
});
Render.run(render);
Runner.run(Runner.create(), engine);

//Building walls for the maze
const walls= [
    Bodies.rectangle(width / 2, 0, width, 10, {label: 'externalWall', isStatic: true, render: {fillStyle: 'grey'}}),
    Bodies.rectangle(width / 2,height, width, 10, {label: 'externalWall', isStatic: true, render: {fillStyle: 'grey'}}),
    Bodies.rectangle(0, height / 2, 10, height, {label: 'externalWall', isStatic: true, render: {fillStyle: 'grey'}}),
    Bodies.rectangle(width, height / 2, 10, height, {label: 'externalWall', isStatic: true, render: {fillStyle: 'grey'}}),
];

World.add(world, walls);

//Sufflign neighbors
const shuffle = (arr) => {
    let counter = arr.length;
    while(counter > 0) {
        const index = Math.floor(Math.random() * counter);
        counter --;
        const temporary = arr[counter];
        arr[counter] = arr[index];
        arr[index] = temporary;
    }
    return arr;
} 

//Grid generation EASY MODE
const grid = Array(cellsVertical).fill(null).map(() => Array(cellsHorizontal).fill(false));

//Verticals Rows
const verticals = Array(cellsVertical).fill(null).map(() => Array(cellsHorizontal-1).fill(false));

//Horizontal Rows
const horizontals = Array(cellsVertical-1).fill(null).map(() => Array(cellsHorizontal).fill(false));

//Start Position
const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);


const moveThroughCell = (row, column) => {
    //Check for validity of cell ( if we moved already through that cell)
    if (grid[row][column] === true) {
        return;
    }
    else{
        grid[row][column] = true;
    }
    //Establishing neighbors of current cell
    const neighbors = shuffle([
        //top
        [row - 1, column, 'top'],
        //right
        [row, column + 1, 'right'],
        //bottom
        [row + 1, column, 'bottom'],
        //left
        [row, column - 1, 'left']
    ]);
    //For each neighbor...
     for (let neighbor of neighbors) {
         const[nextRow, nextColumn, direction] = neighbor;
         //Check if that neighbor is out of bounds
        if (nextRow < 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal) {
            continue;
        }
        //If we visited that neighbor, continue to next neighbor
        if (grid[nextRow][nextColumn]) {
            continue;
        }
         //Remove a wall from either from verticals or horizontals
        if (direction === 'left') {
            verticals[row][column - 1] = true;
        } else if (direction === 'right') {
            verticals[row][column] = true;
        } else if(direction === 'top') {
            horizontals[row - 1][column] = true;
        } else if(direction === 'bottom') {
            horizontals[row][column] = true;
        }

        moveThroughCell(nextRow, nextColumn);
    }
};
moveThroughCell(startRow, startColumn);

horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if(open === true){
            return;
        }
        
        const horizontalWallSegment = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX / 2,
            rowIndex * unitLengthY + unitLengthY,
            unitLengthX,
            5,
            {
                label: 'wall',
                isStatic: true,
                render: {
                    fillStyle: 'grey'
                }
            },
        );
        World.add(world, horizontalWallSegment);
    });
});

verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if(open === true) {
            return;
        }
        const verticalWallSegment = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX,
            rowIndex * unitLengthY + unitLengthY / 2,
            5, 
            unitLengthY,
            {
                label: 'wall',
                isStatic: true,
                render: {
                    fillStyle: 'grey'
                }
            }
        );
        World.add(world, verticalWallSegment);
    });
});

//Goal (finish of the Maze)
const goal = Bodies.rectangle(
    width - unitLengthX / 2,
    height - unitLengthY / 2,
    unitLengthX * .6,
    unitLengthY * .6,
    {
        label: 'goal',
        isStatic: true,
        render: {
            fillStyle: 'red'
        }
    },
);
World.add(world, goal);

//Ball(Player)
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(
    //X-axis position
    unitLengthX / 2,
    //Y-axis position
    unitLengthY / 2,
    //Circle dimension
    ballRadius,
    {
        label: 'ball',
        render: {
            fillStyle: 'yellow'
        }
    }
);
World.add(world, ball);

//Keypress Moves
document.addEventListener('keydown', event => {
    const {x,y} = ball.velocity;
    if(event.keyCode === 87) {
        Body.setVelocity(ball, {x, y: y - 5});
    }
    if(event.keyCode === 68) {
        Body.setVelocity(ball, {x: x + 5, y});
    }
    if(event.keyCode === 83) {
        Body.setVelocity(ball, {x, y: y + 5});
    }
    if(event.keyCode === 65) {
        Body.setVelocity(ball, {x: x - 5, y});
    }
});

//Win-Conditiom
Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach((collision) => {
        const labels = ['ball', 'goal'];
        const winningMessage = document.querySelector('#message');
        if(labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
           world.gravity.y = 1;
            world.bodies.forEach((body) => {
                if(body.label === 'wall') {
                    Body.setStatic(body, false);
                    winningMessage.classList.add('winner');
                }
            })
        }
    });
});
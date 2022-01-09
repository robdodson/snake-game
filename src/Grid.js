import './styles.css';
import React from 'react';

// TODO:
// - Check for snake and food collisions
// - Add snake segments

// To build the snake, start with the idx of a random cell in the grid.
// Every tick, advance the snake using the vector. The snake can not
// go in an opposite direction (if it's going 1, 0 the next turn it can't go -1, 0)

// Every turn, update the food's position, if it is not overlapping with the
// snake then it can stay where it is. If it is overlapping with the snake, it
// should return a flag and move itself.

// When the snake eats food, insert four new segments behind the head

// Loop through the segments and assign each segment to the next segment's
// position.

// The number of cells to add to the snake when it eats food.
const newSnakeCells = 4;

function range(n) {
  return [...Array(n)].map((_, i) => i);
}

function createGrid(cols, rows) {
  return {
    cols,
    rows,
    cells: Array.from({ length: cols * rows }, (_, i) => ({
      idx: i,
      x: i % cols,
      y: Math.floor(i / cols),
      type: null,
    })),
  };
}

function getCell(grid, x, y) {
  if (x >= grid.cols || x < 0 || y >= grid.rows || y < 0) {
    throw new Error(`Out of bound range: ${x}, ${y}`);
  }
  return grid.cells[y * grid.cols + x];
}

function createSnake(grid) {
  const snake = [];
  const cell = getCell(
    grid,
    Math.floor(Math.random() * grid.cols),
    Math.floor(Math.random() * grid.rows)
  );
  snake.push({ ...cell });
  return snake;
}

function createFood(grid, snake) {
  // Remove the snake cells from the grid
  let cells = [...grid.cells];
  snake.forEach((segment) => cells.splice(segment.idx, 1));
  // Return a random empty cell
  return cells[Math.floor(Math.random() * cells.length)];
}

export default class Grid extends React.Component {
  constructor(props) {
    super(props);

    const grid = createGrid(props.cols, props.rows);

    this.snakeRef = React.createRef();
    this.snakeRef.current = createSnake(grid);

    this.foodRef = React.createRef();
    this.foodRef.current = createFood(grid, this.snakeRef.current);

    this.vectorRef = React.createRef();
    this.vectorRef.current = { x: 0, y: 0 };

    this.intervalRef = React.createRef();

    this.state = {
      status: 'pending',
      grid,
    };
  }

  updateSnakePosition = () => {
    const { grid } = this.state;
    const { current: snake } = this.snakeRef;
    const { current: vector } = this.vectorRef;

    let collisionDetected = false;
    let overlapFound = false;
    let newSnake = [];
    for (let i = 0; i < snake.length; i++) {
      const cell = snake[i];
      let newCell;

      // Attempt to advance the head of the snake using the vector.
      // If we hit a boundary, or a snake cell, throw, and stop the game.
      if (i === 0) {
        try {
          // This should throw if we try to get a cell that's outside of
          // the boundary.
          newCell = getCell(grid, cell.x + vector.x, cell.y + vector.y);
          if (newCell.type === 'snake') {
            throw new Error(`The snake ran into itself`);
          }
        } catch (err) {
          newSnake.push(cell);
          collisionDetected = true;
          continue;
        }
        newSnake.push(newCell);
        continue;
      }

      if (collisionDetected) {
        break;
      }

      // After we've eaten food, the snake has to "grow". We check if
      // cells overlap to determine if the snake is growing.
      // If we find an overlap (see below), then we'll set this flag and
      // not grow the snake anymore. The snake should only grow by one
      // cell per turn.
      if (overlapFound) {
        newSnake.push(cell);
        continue;
      }

      // Look at the previous cell and advance to its former position.
      let prevCell = snake[i - 1];
      newCell = { ...prevCell };

      // Look at the next cell, if its new position would overlap with our
      // position, set the overlap flag. This is how we "grow" the snake after
      // it eats food.
      let nextCell = snake[i + 1];
      if (nextCell?.idx === cell.idx) {
        overlapFound = true;
      }

      newSnake.push(newCell);
    }

    this.snakeRef.current = newSnake;
    return collisionDetected;
  };

  updateFoodPosition = () => {
    const { grid } = this.state;
    const { current: snake } = this.snakeRef;
    const { current: food } = this.foodRef;

    // If there was no collision, return false
    if (snake[0].idx !== food.idx) {
      return false;
    }

    // Create a new random food cell
    this.foodRef.current = createFood(grid, snake);
    return true;
  };

  // Clone the head and push it into the snake n times.
  // When we move the snake, we'll check for overlapping parts
  // and only move the ones that don't overlap.
  // This way the snake will appear to grow.
  increaseSnakeCells = () => {
    const { current: snake } = this.snakeRef;
    for (let i = 0; i < newSnakeCells; i++) {
      snake.push({ ...snake[0] });
    }
  };

  drawGrid = () => {
    const { grid } = this.state;
    const { current: snake } = this.snakeRef;
    const { current: food } = this.foodRef;

    let newGrid = createGrid(grid.cols, grid.rows);
    snake.forEach((snakeCell) => {
      let gridCell = getCell(newGrid, snakeCell.x, snakeCell.y);
      gridCell.type = 'snake';
    });
    newGrid.cells[food.idx].type = 'food';
    this.setState({ grid: newGrid });
  };

  updateVector = (e) => {
    let { current: vector } = this.vectorRef;
    const { status } = this.state;
    let newVector = { ...vector };

    // Debugging
    if (e.key === ' ') {
      clearInterval(this.intervalRef.current);
      return;
    }

    if (!e.key.startsWith('Arrow')) {
      return;
    }

    e.preventDefault();

    switch (e.key) {
      case 'ArrowUp':
        newVector = { x: 0, y: -1 };
        break;
      case 'ArrowDown':
        newVector = { x: 0, y: 1 };
        break;
      case 'ArrowLeft':
        newVector = { x: -1, y: 0 };
        break;
      case 'ArrowRight':
        newVector = { x: 1, y: 0 };
        break;
      default:
        break;
    }

    // If the user presses the same direction, or the opposite direction,
    // reject the keypress.
    if (
      (Math.abs(newVector.x) === 1 && Math.abs(vector.x) === 1) ||
      (Math.abs(newVector.y) === 1 && Math.abs(vector.y) === 1)
    ) {
      return;
    }

    this.vectorRef.current = newVector;

    // If this is the user's first move, we need to force an update
    // and start the game loop.
    if (status === 'pending') {
      this.firstMove();
    }
  };

  firstMove = () => {
    this.setState({ status: 'playing' });
    // Render the initial move
    this.tick();
    // Start the game loop
    this.intervalRef.current = setInterval(this.tick, this.props.speed);
  };

  componentDidMount() {
    // Draw the initial layout
    this.updateSnakePosition();
    this.drawGrid();

    // Listen for user input
    window.addEventListener('keyup', this.updateVector);
  }

  tick = () => {
    let collision = this.updateSnakePosition();
    if (collision) {
      this.setState({ status: 'stopped' });
      clearInterval(this.intervalRef.current);
      return;
    }

    let didEatFood = this.updateFoodPosition();
    if (didEatFood) {
      this.increaseSnakeCells();
    }

    this.drawGrid();
  };

  render() {
    const { cols, rows } = this.props;
    const { grid, status } = this.state;
    return (
      <div className="Grid">
        <div>{status}</div>
        <table>
          <thead>
            <tr>
              <td />
              {range(cols).map((col) => (
                <td key={'col-' + col}>{col}</td>
              ))}
            </tr>
          </thead>
          <tbody>
            {range(rows).map((row) => (
              <tr key={'row-' + row}>
                <td>{row}</td>
                {range(cols).map((col) => (
                  <Cell key={row + ',' + col} data={getCell(grid, col, row)} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

function Cell({ data }) {
  return <td className="Cell" data-type={data.type}></td>;
}

import './styles.css';
import React from 'react';

// TODO:
// - Add snake segments
// - Add food

// To build the snake, start with the idx of a random cell in the grid.
// Every tick, advance the snake using the vector. The snake can not
// go in an opposite direction (if it's going 1, 0 the next turn it can't go -1, 0)

// To move the snake, loop through the segments and assign each segment
// to the next segment's position.

// When the snake eats food, insert four new segments behind the head and
// increase the kink counter.

// At this point, only move the head and a fixed amount of segments behind
// the head. The formula is:
// Math.floor(kinkCountdown / newSegments) * newSegments - kinkCountdown

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

    let newSnake = snake.map((cell, i) => {
      if (i === 0) {
        let newCell;
        try {
          newCell = getCell(grid, cell.x + vector.x, cell.y + vector.y);
        } catch (err) {
          newCell = cell;
          this.setState({ status: 'stopped' });
        }
        return newCell;
      }
      return cell;
    });

    this.snakeRef.current = newSnake;
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
    this.updateSnakePosition();
    this.drawGrid();
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
    if (this.state.status === 'stopped') {
      clearInterval(this.intervalRef.current);
      return;
    }

    this.updateSnakePosition();
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

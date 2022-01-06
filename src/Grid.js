import './styles.css';
import { useState, useEffect, useCallback } from 'react';

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
  if (x > grid.cols || x < 0 || y > grid.rows || y < 0) {
    throw new Error(`Out of bound range: ${x}, ${y}`);
  }
  return grid.cells[y * grid.cols + x];
}

function createSnake(grid) {
  const snake = [];
  // const cell = getCell(grid, 0, 0);
  const cell = getCell(
    grid,
    Math.floor(Math.random() * grid.cols),
    Math.floor(Math.random() * grid.rows)
  );
  snake.push({ ...cell });
  return snake;
}

export default function Grid({ cols, rows }) {
  // status types: pending, playing, stopped
  const [status, setStatus] = useState('pending');
  const [grid, setGrid] = useState(() => createGrid(cols, rows));
  const [snake, setSnake] = useState(() => createSnake(grid));
  const [vector, setVector] = useState({ x: 0, y: 0 });

  const updateSnakePosition = useCallback(() => {
    let newSnake = snake.map((cell, i) => {
      if (i === 0) {
        let newCell = getCell(grid, cell.x + vector.x, cell.y + vector.y);
        return newCell;
      }
      return cell;
    });
    setSnake(newSnake);
  }, [snake, grid, vector]);

  const drawGrid = useCallback(() => {
    let newGrid = createGrid(cols, rows);
    snake.forEach((snakeCell) => {
      let gridCell = getCell(newGrid, snakeCell.x, snakeCell.y);
      gridCell.type = 'snake';
    });
    setGrid(newGrid);
  }, [snake, cols, rows]);

  // Force the screen to do an initial update.
  // This is simulating componentDidMount so we tell the exhaustive deps linter
  // to chill
  useEffect(() => {
    updateSnakePosition();
    drawGrid();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      updateSnakePosition();
      drawGrid();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [snake, updateSnakePosition, drawGrid]);

  useEffect(() => {
    function updateVector(e) {
      let newVector;
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
        (Math.abs(newVector.x === 1) && Math.abs(vector.x === 1)) ||
        (Math.abs(newVector.y === 1) && Math.abs(vector.y === 1))
      ) {
        return;
      }

      setVector(newVector);
    }

    window.addEventListener('keyup', updateVector);

    return () => {
      window.removeEventListener('keyup', updateVector);
    };
  }, [vector]);

  return (
    <div className="Grid">
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

function Cell({ data }) {
  return <td className="Cell" data-type={data.type}></td>;
}

const dir = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};

function initBuffers(gl, positions) {
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
  };
}

function createCube(a, b) {
  const x = (a / 50) * 2 - 1;
  const y = (b / 50) * -2 + 1;
  const z = -1.05;
  const l = (1 / 50) * 2;
  return [
    // Front Face
    x,
    y,
    z,
    x + l,
    y,
    z,
    x,
    y - l,
    z,
    x + l,
    y - l,
    z,
    // Back Face
    x,
    y,
    z + l,
    x + l,
    y,
    z + l,
    x,
    y - l,
    z + l,
    x + l,
    y - l,
    z + l,
    // Top Face
    x,
    y,
    z + l,
    x + l,
    y,
    z + l,
    x,
    y,
    z,
    x + l,
    y,
    z,
    // Bottom Face
    x,
    y - l,
    z + l,
    x + l,
    y - l,
    z + l,
    x,
    y - l,
    z,
    x + l,
    y - l,
    z,
    // Left Face
    x,
    y,
    z + l,
    x,
    y,
    z,
    x,
    y - l,
    z + l,
    x,
    y - l,
    z,
    // Right Face
    x + l,
    y,
    z,
    x + l,
    y,
    z + l,
    x + l,
    y - l,
    z,
    x + l,
    y - l,
    z + l,
  ];
}

class SnakeSegment {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.cube = createCube(this.x, this.y);
    this.next = null;
  }
}

class Snake {
  constructor(x = 10, y = 25, direction = dir.right, color = [0.0, 0.0, 0.0]) {
    this.tail = new SnakeSegment(x - 3 * direction.x, y - 3 * direction.y);
    this.tail.next = new SnakeSegment(x - 2 * direction.x, y - 2 * direction.y);
    this.tail.next.next = new SnakeSegment(x - direction.x, y - direction.y);
    this.head = new SnakeSegment(x, y);
    this.tail.next.next.next = this.head;
    this.length = 4;
    this.dir = direction;
    this.nextDir = direction;
    this.color = color;
  }

  heading(direction) {
    this.nextDir = direction;
  }

  // set next state
  eat(apple) {
    if ((this.dir.x !== 0 && this.nextDir.y !== 0) || (this.dir.y !== 0 && this.nextDir.x !== 0)) {
      this.dir = this.nextDir;
    }
    this.head.next = new SnakeSegment(this.head.x + this.dir.x, this.head.y + this.dir.y);
    this.head = this.head.next;
    if (this.head.x === apple.x && this.head.y === apple.y) {
      this.length += 1;
      return true;
    }
    this.tail = this.tail.next;
    return false;
  }

  createBuffer(gl) {
    let cur = this.tail;
    const rects = [];
    while (cur) {
      // rects.push(...cur.rect);
      rects.push(...cur.cube);
      cur = cur.next;
    }
    return initBuffers(gl, rects);
  }

  collide(other) {
    let cur = other.tail;
    while (cur) {
      if (this.head.x === cur.x && this.head.y === cur.y) {
        return true;
      }
      cur = cur.next;
    }
    return false;
  }

  dead() {
    const outofbound = this.head.x > 48 || this.head.x < 1 || this.head.y > 48 || this.head.y < 1;
    let eatmyself = false;
    let cur = this.tail;
    while (cur && cur !== this.head) {
      if (this.head.x === cur.x && this.head.y === cur.y) {
        eatmyself = true;
      }
      cur = cur.next;
    }
    return outofbound || eatmyself;
  }
}

class NPSnake extends Snake {
  constructor() {
    super(
      2 + Math.floor(Math.random() * 47),
      2 + Math.floor(Math.random() * 47),
      dir[Object.keys(dir)[Math.floor(Math.random() * 4)]],
      [Math.random(), Math.random(), Math.random()],
    );
  }

  heading(apple) {
    let gotoX = apple.x - this.head.x;
    let gotoY = apple.y - this.head.y;
    gotoX = gotoX >= 1 || gotoX <= -1 ? gotoX / Math.abs(gotoX) : 0;
    gotoY = gotoY >= 1 || gotoY <= -1 ? gotoY / Math.abs(gotoY) : 0;
    if (gotoX === -1) {
      super.heading(dir.left);
    } else if (gotoX === 1) {
      super.heading(dir.right);
    } else if (gotoY === -1) {
      super.heading(dir.up);
    } else if (gotoY === 1) {
      super.heading(dir.down);
    }
  }
}

class Apple {
  constructor() {
    this.x = 2 + Math.floor(Math.random() * 47);
    this.y = 2 + Math.floor(Math.random() * 47);
    this.buffer = null;
    this.color = [1.0, 0.0, 0.0];
  }

  createBuffer(gl) {
    this.buffer = initBuffers(gl, createCube(this.x, this.y));
  }

  update() {
    this.x = 2 + Math.floor(Math.random() * 47);
    this.y = 2 + Math.floor(Math.random() * 47);
  }
}

class Wall {
  constructor() {
    this.color = [0.4, 0.2, 0.0];
    this.buffer = null;
  }

  createBuffer(gl) {
    const wallArr = [];
    for (let i = 0; i < 50; i += 1) {
      wallArr.push(...createCube(i, 0));
    }
    for (let i = 1; i < 50; i += 1) {
      wallArr.push(...createCube(0, i));
    }
    for (let i = 1; i < 50; i += 1) {
      wallArr.push(...createCube(i, 49));
    }
    for (let i = 1; i < 50; i += 1) {
      wallArr.push(...createCube(49, i));
    }
    this.buffer = initBuffers(gl, wallArr);
  }
}

function createProgramInfo(gl, vsSource, fsSource) {
  function loadShader(type, source) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.log(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }
  const vertexShader = loadShader(gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.log(`error during shader program linking: ${gl.getProgramInfoLog(shaderProgram)}`);
    return null;
  }
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'vertexPosition'),
    },
    uniformLocations: {
      pMatrix: gl.getUniformLocation(shaderProgram, 'pMatrix'),
      color: gl.getUniformLocation(shaderProgram, 'color'),
    },
  };
  return programInfo;
}

function setBuffersNAttributes(gl, programInfo, buffers) {
  // pull from buffer to vertexPosition attribute
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}

function setUniforms(gl, programInfo, pMatrix, color) {
  gl.uniformMatrix4fv(programInfo.uniformLocations.pMatrix, false, pMatrix);
  gl.uniform3fv(programInfo.uniformLocations.color, color);
}

let mysnake;
let apple;
let npsnake;

// display score
const scoreElement = document.getElementById('score');
const scoreNode = document.createTextNode('');
scoreElement.appendChild(scoreNode);

document.addEventListener('keydown', (event) => {
  if (!mysnake) {
    return;
  }
  const { key } = event;
  switch (key) {
    case 'ArrowLeft':
      mysnake.heading(dir.left);
      break;
    case 'ArrowRight':
      mysnake.heading(dir.right);
      break;
    case 'ArrowUp':
      mysnake.heading(dir.up);
      break;
    case 'ArrowDown':
      mysnake.heading(dir.down);
      break;
    default:
  }
});

function main() {
  /** @type {HTMLCanvasElement} */
  const canvas = document.getElementById('canvas');
  const gl = canvas.getContext('webgl');

  if (!gl) {
    return;
  }

  const vsSource = `
    attribute vec3 vertexPosition;
    uniform mat4 pMatrix;

    void main() {
      gl_Position = pMatrix * vec4(vertexPosition, 1.0);
    }
  `;

  const fsSource = `
    uniform highp vec3 color;

    void main() {
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  function init() {
    mysnake = new Snake();
    npsnake = new NPSnake();
    apple = new Apple();
    apple.createBuffer(gl);
    scoreNode.nodeValue = 0;
  }

  init();

  const wall = new Wall();
  wall.createBuffer(gl);

  const programInfo = createProgramInfo(gl, vsSource, fsSource);

  // projectionMatrix
  const pMatrix = mat4.create();
  mat4.perspective(pMatrix, 0.5 * Math.PI, 1, 0.1, 2);

  function drawScene() {
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(programInfo.program);

    // snake
    setBuffersNAttributes(gl, programInfo, mysnake.createBuffer(gl));
    setUniforms(gl, programInfo, pMatrix, mysnake.color);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, mysnake.length * 24);

    // npsnake
    setBuffersNAttributes(gl, programInfo, npsnake.createBuffer(gl));
    setUniforms(gl, programInfo, pMatrix, npsnake.color);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, npsnake.length * 24);

    // apple
    setBuffersNAttributes(gl, programInfo, apple.buffer);
    setUniforms(gl, programInfo, pMatrix, apple.color);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 24);

    // wall
    setBuffersNAttributes(gl, programInfo, wall.buffer);
    setUniforms(gl, programInfo, pMatrix, wall.color);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4728);
  }

  function render() {
    drawScene();

    // next state
    if (mysnake.eat(apple)) {
      apple.update();
      apple.createBuffer(gl);
      scoreNode.nodeValue = mysnake.length - 4;
    }

    if (npsnake.eat(apple)) {
      apple.update();
      apple.createBuffer(gl);
    } else if (Math.random() > 0.3) {
      npsnake.heading(apple);
    }

    if (npsnake.dead() || npsnake.collide(mysnake)) {
      npsnake = new NPSnake();
    }

    // gameover
    if (mysnake.dead() || mysnake.collide(npsnake)) {
      init();
      setTimeout(render, 1000);
    } else {
      setTimeout(render, 50);
    }
  }
  setTimeout(render, 50);
}

main();

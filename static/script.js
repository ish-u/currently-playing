window.addEventListener("DOMContentLoaded", () => {
  fetch("/currently-playing")
    .then((res) => res.json())
    .then((data) => {
      document.title = data.name;
      const favicon = document.getElementById("favicon");
      if (favicon) {
        favicon.href = data.image;
      }
      main();
    })
    .catch((e) => console.error(e));
});

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {boolean}
 **/
function resizeCanvasToDisplaySize(canvas) {
  // Lookup the size the browser is displaying the canvas in pixels
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  // Check if the canvas is not the same size
  const needResize =
    canvas.width !== displayWidth || canvas.height !== displayHeight;

  if (needResize) {
    // Make the canvas the same size
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }

  return needResize;
}

let vertexShaderSource = `#version 300 es

in vec4 a_position;

void main() {
    gl_Position = a_position;
}
`;

let fragmentShaderSource = `#version 300 es

precision highp float;

out vec4 outColor;

void main() {
    outColor = vec4(1, 0, 0.25, 1);
}
`;

/**
 * Creates and compiles a shader.
 * @param {WebGL2RenderingContext} gl - The WebGL Context
 * @param {number} type - gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
 * @param {string} source - GLSL Source Code
 * @returns {WebGLShader | null}
 **/
function createShader(gl, type, source) {
  let shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.error(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

/**
 * Create shader program.
 * @param {WebGL2RenderingContext} gl - The WebGL Context
 * @param {WebGLShader} vertexShader
 * @param {WebGLShader} fragmentShader
 * @returns {WebGLProgram | null}
 **/
function createProgram(gl, vertexShader, fragmentShader) {
  let program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  let success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.error(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

/**
 * Initialize WebGL.
 **/
function main() {
  /** @type {HTMLCanvasElement | null} */
  const canvas = document.getElementById("canvas");
  if (canvas) {
    let gl = canvas.getContext("webgl2");
    let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    let fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource
    );
    let program = createProgram(gl, vertexShader, fragmentShader);
    console.log(program);

    // Attributes
    let positionAttributeLocation = gl.getAttribLocation(program, "a_position");

    // Buffers
    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [0, 0, 0, 0.5, 0.7, 0];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Vertex Attribute Array - State
    let vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionAttributeLocation);

    // Fetching Data
    let size = 2; // 2 component per iterations
    let type = gl.FLOAT; // the data is 32 bit float
    let normalize = false;
    let stride = 0; // move forward size * sizeof(type)
    let offset = 0; // start at the beginning of buffer
    gl.vertexAttribPointer(
      positionAttributeLocation,
      size,
      type,
      normalize,
      stride,
      offset
    );

    drawScene();

    // Drawing Scene
    function drawScene() {
      resizeCanvasToDisplaySize(canvas);

      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height); // Map Clip Space -1 to 1 => 0 - canvas width, 0 - canvas height
      gl.clearColor(0, 0, 0, 0); // Make canvas transparent
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program); // use our Web GL Program

      gl.bindVertexArray(vao); // bind attributes and buffers

      let primitiveType = gl.TRIANGLES;
      let offset = 0;
      let count = 3;
      gl.drawArrays(primitiveType, offset, count);
    }
  }
}

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

uniform vec2 u_resolution;
uniform vec2 u_mouse;

out vec4 outColor;

void main() {
    // outColor = vec4(fract(gl_FragCoord.xy / 100.0), 0, 1);
    // outColor = vec4(fract(gl_FragCoord.xy / u_resolution), 0, 1);
    outColor = vec4(fract((gl_FragCoord.xy - u_mouse) / u_resolution), 0, 1);
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
      fragmentShaderSource,
    );
    let program = createProgram(gl, vertexShader, fragmentShader);

    // Attributes - vertex data location in vertex shader
    let positionAttributeLocation = gl.getAttribLocation(program, "a_position");

    // lookup unifrom locations
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const mouseLocation = gl.getUniformLocation(program, "u_mouse");

    // Vertex Attribute Array - State
    let vao = gl.createVertexArray();
    gl.bindVertexArray(vao); // bind vao to current context

    // Buffer - put three 2d clip space points in
    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer); // bind it to ARRAY_BUFFER

    // Filling buffer with co-ordinates of two triangle that will fill up the clip space
    const positions = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Turn on attribute
    gl.enableVertexAttribArray(positionAttributeLocation);

    // Fetching Data for the current attribute at location positionAttributeLocation
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
      offset,
    );

    let mouseX = 0;
    let mouseY = 0;

    /**
     * Handle Mouse movement.
     * @param {MouseEvent} e
     **/
    function setMousePostion(e) {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = rect.height - (e.clientY - rect.top) - 1;
      drawScene();
    }

    canvas.addEventListener("mousemove", setMousePostion);
    canvas.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
      },
      { passive: false },
    );
    canvas.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
        setMousePosition(e.touches[0]);
      },
      { passive: false },
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

      gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
      gl.uniform2f(mouseLocation, mouseX, mouseY);

      let primitiveType = gl.TRIANGLES;
      let offset = 0;
      let count = 6;
      gl.drawArrays(primitiveType, offset, count);
    }
  }
}

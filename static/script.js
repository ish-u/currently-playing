import SHADERS from "./shaders.js";

/** @type {WebGL2RenderingContext | null} */
let GL_GLOBAL;

/** @type {WebGLVertexArrayObject | null} */
let vao;

let currentShaderIndex = 0;

/** @type {WebGLProgram | null} */
let currentProgram;

/** @type {WebGLUniformLocation | null} */
let resolutionLocation, mouseLocation, timeLocation, paletteLocation;

/** @type {Number} */
let mouseX,
  mouseY = 0;

/** @type {string} */
let currentFragmentShaderSource = SHADERS[0];

/** @type {Array<Number>} */
let palette = [
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0],
];

const vertexShaderSource = `#version 300 es

in vec4 a_position;

void main() {
    gl_Position = a_position;
}
`;

/**
 * Handle Mouse movement.
 * @param {MouseEvent} e
 **/
function setMousePostion(e) {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = rect.height - (e.clientY - rect.top) - 1;
}

// Ref - https://webgl2fundamentals.org/webgl/lessons/webgl-shadertoy.html
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
 * Render shader.
 * @param {float} time
 **/
function render(time) {
  time *= 0.001; // convert to seconds

  resizeCanvasToDisplaySize(canvas);

  GL_GLOBAL.viewport(0, 0, GL_GLOBAL.canvas.width, GL_GLOBAL.canvas.height); // Map Clip Space -1 to 1 => 0 - canvas width, 0 - canvas height
  GL_GLOBAL.clearColor(0, 0, 0, 0); // Make canvas transparent
  GL_GLOBAL.clear(GL_GLOBAL.COLOR_BUFFER_BIT);

  GL_GLOBAL.useProgram(currentProgram); // use our Web GL Program

  GL_GLOBAL.bindVertexArray(vao); // bind attributes and buffers

  GL_GLOBAL.uniform3f(
    resolutionLocation,
    GL_GLOBAL.canvas.width,
    GL_GLOBAL.canvas.height,
    window.devicePixelRatio || 1,
  );
  GL_GLOBAL.uniform2f(mouseLocation, mouseX, mouseY);
  GL_GLOBAL.uniform1f(timeLocation, time);
  GL_GLOBAL.uniform3fv(paletteLocation, palette.flat());

  let primitiveType = GL_GLOBAL.TRIANGLES;
  let offset = 0;
  let count = 6;
  GL_GLOBAL.drawArrays(primitiveType, offset, count);
  requestAnimationFrame(render);
}

/**
 * Initialize Shader.
 * @param {WebGL2RenderingContext} gl - The WebGL Context
 **/
function initShader(gl) {
  const fragmentShaderSource = `#version 300 es
precision highp float;

uniform vec3 iResolution;
uniform vec2 iMouse;
uniform float iTime;
uniform vec3 iPalette[8];

out vec4 outColor;

${currentFragmentShaderSource}

void main() {
    mainImage(outColor, gl_FragCoord.xy);
}
`;

  let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  let fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource,
  );

  const program = createProgram(gl, vertexShader, fragmentShader);

  if (!program) return;

  currentProgram = program;

  // Fetching Data for the current attribute at location positionAttributeLocation
  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  // lookup unifrom locations
  resolutionLocation = gl.getUniformLocation(program, "iResolution");
  mouseLocation = gl.getUniformLocation(program, "iMouse");
  timeLocation = gl.getUniformLocation(program, "iTime");
  paletteLocation = gl.getUniformLocation(program, "iPalette");
}

/**
 * Initialize WebGL.
 **/
function main() {
  /** @type {HTMLCanvasElement | null} */
  const canvas = document.getElementById("canvas");
  if (canvas) {
    let gl = canvas.getContext("webgl2", { antialias: true });
    GL_GLOBAL = gl;
    canvas.width = canvas.clientWidth * window.devicePixelRatio || 1;
    canvas.height = canvas.clientHeight * window.devicePixelRatio || 1;

    // Vertex Attribute Array - State
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao); // bind vao to current context

    // Buffer - put three 2d clip space points in
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer); // bind it to ARRAY_BUFFER

    // Filling buffer with co-ordinates of two triangle that will fill up the clip space
    const positions = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    initShader(gl);

    canvas.addEventListener("mousemove", setMousePostion);
    requestAnimationFrame(render);
  }
}

/**
 * Change Shader
 * @param {string} shader
 **/
function changeFragmentShaderSource(shader) {
  currentFragmentShaderSource = shader;
  initShader(GL_GLOBAL);
}

window.addEventListener("DOMContentLoaded", () => {
  fetch("/currently-playing")
    .then((res) => res.json())
    .then((data) => {
      document.title = data.name;
      const favicon = document.getElementById("favicon");
      if (favicon) {
        favicon.href = data.image;
      }

      const image = new Image();
      image.src = data.image;
      image.crossOrigin = "Anonymous";

      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = image.width;
        canvas.height = image.height;
        if (ctx) {
          ctx.drawImage(image, 0, 0, image.width, image.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          const bucket = (v, size = 24) => Math.floor(v / size) * size;

          const colorMap = {};

          for (let i = 0; i < imageData.data.length; i += 4) {
            const r = bucket(imageData.data[i]);
            const g = bucket(imageData.data[i + 1]);
            const b = bucket(imageData.data[i + 2]);
            const color = `rgb,${r},${g},${b}`;
            if (colorMap[color]) {
              colorMap[color] += 1;
            } else {
              colorMap[color] = 1;
            }
          }

          let colors = [];
          for (let color in colorMap) {
            colors.push([color, colorMap[color]]);
          }
          colors.sort(function (a, b) {
            return b[1] - a[1];
          });

          palette = colors
            .slice(0, 8)
            .map((color) => color[0])
            .map((color) =>
              color
                .split(",")
                .slice(1)
                .map((color) => parseInt(color) / 255),
            );
        }
      };

      main();
      document.getElementById("prev-button")?.addEventListener("click", () => {
        currentShaderIndex =
          (currentShaderIndex - 1 + SHADERS.length) % SHADERS.length;
        changeFragmentShaderSource(SHADERS[currentShaderIndex]);
      });
      document.getElementById("next-button")?.addEventListener("click", () => {
        currentShaderIndex = (currentShaderIndex + 1) % SHADERS.length;
        changeFragmentShaderSource(SHADERS[currentShaderIndex]);
      });
    })
    .catch((e) => console.error(e));
});

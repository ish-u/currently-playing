const FRACTAL_CIRCLES = `
// cosine based palette, 4 vec3 params
vec3 palette(float t)
{    
    t = clamp(t, 0.0, 1.0);
    float scaled = t * 7.0;
    int i = int(floor(scaled));
    int j = min(i + 1, 7);
    float f = fract(scaled);
    return mix(iPalette[i], iPalette[j], f);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;
    
    vec3 finalColor = vec3(0.0);
    
    vec2 uv0 = uv;
    
    for(float i = 0.0; i < 2.0; i++){

        uv = fract(uv*2.) - 0.5;

        float d = length(uv) * exp(-length(uv0));

        vec3 col = palette(fract(length(uv0) + i*.8 + iTime*0.8));

        d = sin(d*8. + iTime)/8.;
        d = abs(d);

        //d = smoothstep(0.0,0.1,d);
        d = pow(0.03 / d, 3.0);

        finalColor += col * d;
    }
    fragColor = vec4(finalColor,1.0);
}
`;
const HEARTS = `
const float PI = 3.14;
mat2 rotationMatrix(float angle)
{
	angle *= PI / 180.0;
    float s=sin(angle), c=cos(angle);
    return mat2( c, -s, 
                 s,  c );
}

vec3 palette(float t)
{    
    t = clamp(t, 0.0, 1.0);
    float scaled = t * float(7); 
    int index = int(floor(scaled));
    int nextIndex = min(index + 1, 7);
    return mix(iPalette[index], iPalette[nextIndex], 0.);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    
    vec2 uv = (2.0*fragCoord - iResolution.xy) / iResolution.y;
    uv *= rotationMatrix(iTime*25.0);
    uv = (fract(uv * 2.0) * 3.0) - 1.5;
    uv *= rotationMatrix(-1.0*iTime*100.0);    
    float d = (pow(uv.x, 2.) + pow(uv.y, 2.) - uv.y * abs(uv.x));
    d = exp(sin(d)) + iTime*0.8 + d;
    vec3 col = palette(mod(d * 0.1 + iTime * 0.2, 1.0));
    fragColor = vec4(col,1.0);
    
}
`;

const ROTATING_SQUARES = `
// Ref - https://www.shadertoy.com/view/3lVGWt
const float PI = 3.14;
mat2 rotationMatrix(float angle)
{
    angle *= PI / 180.0;
    float s=sin(angle), c=cos(angle);
    return mat2( c, -s, 
                 s,  c );
}

// Red - https://www.shadertoy.com/view/4llXD7
float sdBox( in vec2 p, in vec2 b )
{
    vec2 d = abs(p)-b;
    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}

vec3 palette(float t)
{    
    t = clamp(t, 0.0, 1.0);
    float scaled = t * 7.0;
    int i = int(floor(scaled));
    int j = min(i + 1, 7);
    float f = fract(scaled);
    return mix(iPalette[i], iPalette[j], f);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = ( 2.*fragCoord - iResolution.xy ) / iResolution.y;
    uv *= rotationMatrix(iTime*20.0);
    uv = fract(uv*3.0) - 0.5;
    float d =  smoothstep(9./iResolution.y,0.0,sdBox(uv, vec2(abs(sin(iTime))* 0.4)));
    if(d < 0.1){
      fragColor = vec4(palette(mod(d * 0.1 + iTime * 0.05, 1.0)), 1.0);
      return;
    }
    fragColor = vec4(vec3(d) + iPalette[3], 1.0);
}
`;

const PALLETE = `
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord.xy / iResolution.xy;

    float t = clamp(uv.y * uv.x, 0.0, 1.0);
    float scaled = t * 7.0 ;
    int i = int(floor(scaled));
    int j = min(i + 1, 7);
    fragColor = vec4(mix(iPalette[i], iPalette[j], 1.),1.0);
}
`;

const SHADERS = [PALLETE, FRACTAL_CIRCLES, ROTATING_SQUARES, HEARTS];
export default SHADERS;

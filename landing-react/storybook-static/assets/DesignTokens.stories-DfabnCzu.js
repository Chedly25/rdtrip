import{j as e}from"./jsx-runtime-D_zvdyIk.js";const s={title:"Design System/Design Tokens",parameters:{docs:{description:{component:`
# Design Tokens

RDTrip uses a comprehensive token system based on **OKLCH color space** for better perceptual uniformity and dark mode support.

## Color System

### Brand Colors
Our primary brand color is a calming blue that evokes trust and adventure.
- Brand 500 (Primary): oklch(55% 0.12 220) - #457B9D

### Neutral Colors
Warm undertone neutrals provide a premium, inviting feel.
- Range from white (oklch(100% 0 0)) to near-black (oklch(20% 0.005 80))

### Semantic Colors
- Success: oklch(65% 0.15 145) - Green
- Error: oklch(60% 0.20 25) - Red
- Warning: oklch(75% 0.15 85) - Amber
- Info: oklch(65% 0.15 240) - Blue

### Agent Theme Colors
- Adventure: oklch(65% 0.15 145) - Green
- Culture: oklch(70% 0.15 70) - Amber
- Food: oklch(62% 0.20 25) - Red
- Hidden Gems: oklch(62% 0.15 240) - Blue

## Typography

**Font Family**: Inter (self-hosted)
- Available weights: 400, 500, 600, 700
- Variable font support for modern browsers

**Type Scale** (Major third - 1.250):
- XS: 12px
- SM: 14px
- Base: 16px
- LG: 18px
- XL: 20px
- 2XL: 24px
- 3XL: 28px
- 4XL: 36px
- 5XL: 48px
- 6XL: 64px

## Spacing

8pt grid system:
- space-1: 4px
- space-2: 8px
- space-4: 16px
- space-6: 24px
- space-8: 32px
- space-12: 48px
- space-16: 64px

## Border Radius
- sm: 8px - Small elements, badges
- md: 10px - Inputs, buttons
- lg: 16px - Cards, modals
- xl: 24px - Large cards
- 2xl: 32px - Hero elements
- full: 9999px - Pills, avatars

## Shadows
Layered elevation system from subtle (xs) to prominent (2xl).
Special brand-colored shadows for interactive elements.

## Animation

**Durations**:
- instant: 0ms
- fast: 150ms
- base: 300ms
- slow: 500ms
- slower: 700ms

**Easing**:
- ease-out: cubic-bezier(0, 0, 0.2, 1)
- ease-macos: cubic-bezier(0.16, 1, 0.3, 1)

## Usage Examples

\`\`\`css
.card {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
}
\`\`\`

## Accessibility

- All text colors meet WCAG AA standards (4.5:1 minimum)
- Focus indicators with \`--shadow-focus\`
- Reduced motion support: animations automatically disabled
- Dark mode: automatic token adjustments
        `}}}},r=()=>e.jsxs("div",{style:{padding:"20px"},children:[e.jsx("h3",{children:"Brand Colors"}),e.jsx("div",{style:{display:"flex",gap:"10px",marginBottom:"30px"},children:[50,100,200,300,400,500,600,700,800,900].map(n=>e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{style:{height:"80px",backgroundColor:`var(--color-brand-${n})`,borderRadius:"8px",marginBottom:"8px"}}),e.jsx("div",{style:{fontSize:"12px",textAlign:"center"},children:n})]},n))}),e.jsx("h3",{children:"Semantic Colors"}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:"16px"},children:["success","error","warning","info"].map(n=>e.jsxs("div",{children:[e.jsx("div",{style:{height:"80px",backgroundColor:`var(--color-${n})`,borderRadius:"8px",marginBottom:"8px"}}),e.jsx("div",{style:{fontSize:"14px",textTransform:"capitalize"},children:n})]},n))}),e.jsx("h3",{children:"Spacing Scale (8pt grid)"}),e.jsx("div",{style:{marginTop:"20px"},children:[1,2,3,4,6,8,12,16].map(n=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"16px",marginBottom:"12px"},children:[e.jsxs("div",{style:{width:"100px",fontSize:"14px"},children:["space-",n]}),e.jsx("div",{style:{width:`${n*4}px`,height:"32px",backgroundColor:"#457B9D",borderRadius:"4px"}}),e.jsxs("div",{style:{fontSize:"12px",color:"#666"},children:[n*4,"px"]})]},n))}),e.jsx("h3",{children:"Border Radius"}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:"16px",marginTop:"20px"},children:["sm","md","lg","xl","2xl","full"].map(n=>e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{width:"80px",height:"80px",backgroundColor:"#457B9D",borderRadius:`var(--radius-${n})`,margin:"0 auto 8px"}}),e.jsx("div",{style:{fontSize:"14px"},children:n})]},n))})]});r.__docgenInfo={description:"",methods:[],displayName:"ColorPalette"};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`() => <div style={{
  padding: '20px'
}}>
    <h3>Brand Colors</h3>
    <div style={{
    display: 'flex',
    gap: '10px',
    marginBottom: '30px'
  }}>
      {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(weight => <div key={weight} style={{
      flex: 1
    }}>
          <div style={{
        height: '80px',
        backgroundColor: \`var(--color-brand-\${weight})\`,
        borderRadius: '8px',
        marginBottom: '8px'
      }} />
          <div style={{
        fontSize: '12px',
        textAlign: 'center'
      }}>{weight}</div>
        </div>)}
    </div>

    <h3>Semantic Colors</h3>
    <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px'
  }}>
      {['success', 'error', 'warning', 'info'].map(color => <div key={color}>
          <div style={{
        height: '80px',
        backgroundColor: \`var(--color-\${color})\`,
        borderRadius: '8px',
        marginBottom: '8px'
      }} />
          <div style={{
        fontSize: '14px',
        textTransform: 'capitalize'
      }}>{color}</div>
        </div>)}
    </div>

    <h3>Spacing Scale (8pt grid)</h3>
    <div style={{
    marginTop: '20px'
  }}>
      {[1, 2, 3, 4, 6, 8, 12, 16].map(size => <div key={size} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '12px'
    }}>
          <div style={{
        width: '100px',
        fontSize: '14px'
      }}>
            space-{size}
          </div>
          <div style={{
        width: \`\${size * 4}px\`,
        height: '32px',
        backgroundColor: '#457B9D',
        borderRadius: '4px'
      }} />
          <div style={{
        fontSize: '12px',
        color: '#666'
      }}>
            {size * 4}px
          </div>
        </div>)}
    </div>

    <h3>Border Radius</h3>
    <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginTop: '20px'
  }}>
      {['sm', 'md', 'lg', 'xl', '2xl', 'full'].map(size => <div key={size} style={{
      textAlign: 'center'
    }}>
          <div style={{
        width: '80px',
        height: '80px',
        backgroundColor: '#457B9D',
        borderRadius: \`var(--radius-\${size})\`,
        margin: '0 auto 8px'
      }} />
          <div style={{
        fontSize: '14px'
      }}>{size}</div>
        </div>)}
    </div>
  </div>`,...r.parameters?.docs?.source}}};const o=["ColorPalette"];export{r as ColorPalette,o as __namedExportsOrder,s as default};

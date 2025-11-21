import{j as e}from"./jsx-runtime-D_zvdyIk.js";const i={title:"Guidelines/Accessibility",parameters:{docs:{description:{component:`
# Accessibility Guidelines

RDTrip is committed to WCAG 2.1 AA compliance and creating an inclusive experience for all users.

## Keyboard Navigation

All interactive elements are fully keyboard-accessible:

| Shortcut | Action |
|----------|--------|
| Tab | Move forward through elements |
| Shift + Tab | Move backward |
| Enter / Space | Activate buttons/links |
| Escape | Close modals |
| Arrow Keys | Navigate within components |

### Navigation Flow
1. Skip to Content link appears first
2. Logical tab order follows visual layout
3. No keyboard traps
4. Modal focus trap keeps focus within dialog

## Focus Management

Clear, visible focus indicators on all interactive elements:

\`\`\`css
:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
  box-shadow: var(--shadow-focus);
}
\`\`\`

## Screen Reader Support

### Semantic Structure
\`\`\`html
<header role="banner">
  <nav role="navigation" aria-label="Main navigation">...</nav>
</header>
<main role="main" id="main-content">...</main>
<footer role="contentinfo">...</footer>
\`\`\`

### ARIA Labels
\`\`\`html
<button aria-label="Save route to your collection">
  <Save aria-hidden="true" />
  Save
</button>
\`\`\`

### Live Regions
\`\`\`html
<div role="status" aria-live="polite" aria-atomic="true">
  <p>Generating your route... 75% complete</p>
</div>
\`\`\`

## Color Contrast

All text meets WCAG AA standards:
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- Primary text on white: 16:1 ✓
- Interactive elements: 4.6:1 ✓

## Forms & Validation

Accessible form design:

\`\`\`html
<label htmlFor="origin">
  Starting City
  <span aria-label="required">*</span>
</label>
<input
  id="origin"
  aria-required="true"
  aria-describedby="origin-help origin-error"
  aria-invalid={hasError}
/>
<p id="origin-help">Enter the city where your trip begins</p>
{hasError && <p id="origin-error" role="alert">{error}</p>}
\`\`\`

## Motion & Animation

Respects user motion preferences:

\`\`\`css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
\`\`\`

## Mobile Accessibility

Touch-friendly interface:
- Minimum touch target: 44x44px (iOS), 48x48px (Android)
- Minimum spacing: 8px between targets
- Extended hit areas for small icons

## Testing Checklist

### Automated
- [ ] Lighthouse: 95+ Accessibility score
- [ ] axe DevTools: 0 violations
- [ ] WAVE: 0 errors

### Manual
- [ ] Keyboard navigation complete page flow
- [ ] Screen reader (NVDA/JAWS/VoiceOver)
- [ ] 200% zoom without horizontal scroll
- [ ] Touch targets 44px minimum
- [ ] Reduced motion animations disable

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension
- [WAVE](https://wave.webaim.org/) - Evaluation tool
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/) - Chrome DevTools
- [NVDA](https://www.nvaccess.org/) - Free screen reader

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project](https://www.a11yproject.com/)
- [WebAIM](https://webaim.org/)

**Remember**: Accessibility is not a feature, it's a requirement. Build it in from the start.
        `}}}},o=()=>e.jsxs("div",{style:{padding:"20px",maxWidth:"800px"},children:[e.jsx("h2",{children:"Interactive Examples"}),e.jsxs("section",{style:{marginBottom:"40px"},children:[e.jsx("h3",{children:"Accessible Button"}),e.jsx("button",{style:{padding:"12px 24px",backgroundColor:"#457B9D",color:"white",border:"none",borderRadius:"8px",fontSize:"16px",fontWeight:600,cursor:"pointer"},"aria-label":"Save route to your collection",children:"Save Route"}),e.jsx("p",{style:{fontSize:"14px",color:"#666",marginTop:"8px"},children:"Try tabbing to this button and pressing Enter or Space"})]}),e.jsxs("section",{style:{marginBottom:"40px"},children:[e.jsx("h3",{children:"Form Field with Label"}),e.jsxs("div",{children:[e.jsxs("label",{htmlFor:"demo-input",style:{display:"block",marginBottom:"8px",fontWeight:500},children:["Starting City",e.jsx("span",{style:{color:"#EF4444",marginLeft:"4px"},children:"*"})]}),e.jsx("input",{id:"demo-input",type:"text",placeholder:"e.g., Paris","aria-required":"true","aria-describedby":"demo-help",style:{width:"100%",padding:"12px",border:"2px solid #E5E7EB",borderRadius:"8px",fontSize:"16px"}}),e.jsx("p",{id:"demo-help",style:{fontSize:"14px",color:"#666",marginTop:"8px"},children:"Enter the city where your trip begins"})]})]}),e.jsxs("section",{children:[e.jsx("h3",{children:"Focus Indicators"}),e.jsxs("div",{style:{display:"flex",gap:"16px",flexWrap:"wrap"},children:[e.jsx("button",{style:{padding:"12px 24px",backgroundColor:"white",color:"#457B9D",border:"2px solid #457B9D",borderRadius:"8px",fontSize:"16px",fontWeight:600,cursor:"pointer"},children:"Primary Action"}),e.jsx("button",{style:{padding:"12px 24px",backgroundColor:"#F3F4F6",color:"#374151",border:"none",borderRadius:"8px",fontSize:"16px",fontWeight:600,cursor:"pointer"},children:"Secondary Action"}),e.jsx("a",{href:"#",style:{padding:"12px 24px",color:"#457B9D",textDecoration:"underline",fontSize:"16px",fontWeight:600},children:"Text Link"})]}),e.jsx("p",{style:{fontSize:"14px",color:"#666",marginTop:"16px"},children:"Tab through these elements to see the focus indicators"})]})]});o.__docgenInfo={description:"",methods:[],displayName:"Examples"};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`() => <div style={{
  padding: '20px',
  maxWidth: '800px'
}}>
    <h2>Interactive Examples</h2>

    <section style={{
    marginBottom: '40px'
  }}>
      <h3>Accessible Button</h3>
      <button style={{
      padding: '12px 24px',
      backgroundColor: '#457B9D',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: 600,
      cursor: 'pointer'
    }} aria-label="Save route to your collection">
        Save Route
      </button>
      <p style={{
      fontSize: '14px',
      color: '#666',
      marginTop: '8px'
    }}>
        Try tabbing to this button and pressing Enter or Space
      </p>
    </section>

    <section style={{
    marginBottom: '40px'
  }}>
      <h3>Form Field with Label</h3>
      <div>
        <label htmlFor="demo-input" style={{
        display: 'block',
        marginBottom: '8px',
        fontWeight: 500
      }}>
          Starting City
          <span style={{
          color: '#EF4444',
          marginLeft: '4px'
        }}>*</span>
        </label>
        <input id="demo-input" type="text" placeholder="e.g., Paris" aria-required="true" aria-describedby="demo-help" style={{
        width: '100%',
        padding: '12px',
        border: '2px solid #E5E7EB',
        borderRadius: '8px',
        fontSize: '16px'
      }} />
        <p id="demo-help" style={{
        fontSize: '14px',
        color: '#666',
        marginTop: '8px'
      }}>
          Enter the city where your trip begins
        </p>
      </div>
    </section>

    <section>
      <h3>Focus Indicators</h3>
      <div style={{
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap'
    }}>
        <button style={{
        padding: '12px 24px',
        backgroundColor: 'white',
        color: '#457B9D',
        border: '2px solid #457B9D',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: 600,
        cursor: 'pointer'
      }}>
          Primary Action
        </button>
        <button style={{
        padding: '12px 24px',
        backgroundColor: '#F3F4F6',
        color: '#374151',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: 600,
        cursor: 'pointer'
      }}>
          Secondary Action
        </button>
        <a href="#" style={{
        padding: '12px 24px',
        color: '#457B9D',
        textDecoration: 'underline',
        fontSize: '16px',
        fontWeight: 600
      }}>
          Text Link
        </a>
      </div>
      <p style={{
      fontSize: '14px',
      color: '#666',
      marginTop: '16px'
    }}>
        Tab through these elements to see the focus indicators
      </p>
    </section>
  </div>`,...o.parameters?.docs?.source}}};const r=["Examples"];export{o as Examples,r as __namedExportsOrder,i as default};

import{j as n}from"./jsx-runtime-D_zvdyIk.js";import{r as g}from"./iframe-DDPK2Gl8.js";import{m as H}from"./createLucideIcon-ng10wjsk.js";import{M as D,C as U}from"./map-pin-BSBVo15b.js";import"./preload-helper-PPVm8Dsz.js";const P="_card_1ucq7_16",R="_imageContainer_1ucq7_34",E="_imageLoading_1ucq7_41",G="_image_1ucq7_34",W="_imageFallback_1ucq7_59",N="_spinner_1ucq7_66",z="_content_1ucq7_88",V="_title_1ucq7_92",O="_durationBadge_1ucq7_103",K="_durationText_1ucq7_111",J="_themeBadges_1ucq7_120",Q="_themeBadge_1ucq7_120",X="_description_1ucq7_141",Y="_highlightsLabel_1ucq7_155",Z="_highlightsList_1ucq7_164",ee="_highlight_1ucq7_155",ae="_highlightBullet_1ucq7_178",o={card:P,imageContainer:R,imageLoading:E,image:G,imageFallback:W,spinner:N,content:z,title:V,durationBadge:O,durationText:K,themeBadges:J,themeBadge:Q,description:X,highlightsLabel:Y,highlightsList:Z,highlight:ee,highlightBullet:ae},k=new Map;async function ne(e,t=800){if(typeof e!="string")return console.warn("Wikipedia image search: invalid location name",e),null;const a=`${e}_${t}`;if(k.has(a))return k.get(a);try{const i=e.replace(/[,()]/g,"").trim(),s=await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(i)}`,{headers:{Accept:"application/json"}});if(s.ok){const r=await s.json();if(r.thumbnail&&r.thumbnail.source){const h=r.thumbnail.source.replace(/\/\d+px-/,`/${t}px-`);return k.set(a,h),h}}}catch(i){console.warn(`Wikipedia image search failed for ${e}:`,i)}return null}const te=10080*60*1e3,ie="cityImage:";function S(e,t){const a=e.toLowerCase().trim(),i=t?.toLowerCase().trim()||"";return`${ie}${a}${i?`:${i}`:""}`}function se(e,t){try{const a=S(e,t),i=localStorage.getItem(a);if(!i)return null;const s=JSON.parse(i),r=Date.now()-s.timestamp;return r>te?(console.log(`⏰ LocalStorage cache expired for ${e} (age: ${Math.round(r/(1440*60*1e3))} days)`),localStorage.removeItem(a),null):(console.log(`✅ LocalStorage cache hit for ${e} (source: ${s.source}, age: ${Math.round(r/(1440*60*1e3))} days)`),s.url)}catch(a){return console.error("❌ Failed to get cached image:",a),null}}function A(e,t,a,i){try{const s=S(e,i),r={url:t,timestamp:Date.now(),source:a};localStorage.setItem(s,JSON.stringify(r)),console.log(`💾 Cached ${e} image in localStorage (source: ${a})`)}catch(s){console.error("❌ Failed to cache image:",s)}}async function re(e,t){try{const i=new URLSearchParams({city:e});t&&i.append("country",t);const s=await fetch(`/api/places/city-image?${i}`);if(!s.ok)return console.warn(`⚠️ Backend API returned ${s.status} for ${e}`),null;const r=await s.json();return r.imageUrl?(console.log(`✅ Got image from backend for ${e} (source: ${r.source})`),r.source&&A(e,r.imageUrl,r.source,t),r.imageUrl):null}catch(a){return console.error(`❌ Backend API error for ${e}:`,a),null}}async function oe(e,t){try{console.log(`🖼️ Fetching image for: ${e}${t?`, ${t}`:""}`);const a=se(e,t);if(a)return a;console.log(`📚 Trying Wikipedia for ${e}...`);const i=await ne(e,800);if(i)return console.log(`✅ Found Wikipedia image for ${e}`),A(e,i,"wikipedia",t),i;console.log(`🌐 Trying backend API for ${e}...`);const s=await re(e,t);return s||(console.log(`❌ No image found for ${e}`),null)}catch(a){return console.error(`❌ fetchCityImage error for ${e}:`,a),null}}const ce={adventure:"#055948",culture:"#a87600",food:"#650411","hidden-gems":"#081d5b"},le={adventure:"Adventure",culture:"Culture",food:"Food","hidden-gems":"Hidden Gems"};function L({city:e,index:t,themeColor:a,showThemeBadges:i=!1,themes:s=[],onClick:r}){const[h,$]=g.useState(e.image||e.imageUrl||null),[F,j]=g.useState(!e.image&&!e.imageUrl),[M,q]=g.useState(!1),l=e.name||e.city||"Unknown",d=e.activities||e.highlights||[],T=e.description||e.why||"";return console.log(`🔍 CityCard DEBUG - ${l}:`,{hasActivities:!!e.activities,activitiesType:Array.isArray(e.activities)?"array":typeof e.activities,activitiesLength:Array.isArray(e.activities)?e.activities.length:0,hasHighlights:!!e.highlights,highlightsType:Array.isArray(e.highlights)?"array":typeof e.highlights,highlightsLength:Array.isArray(e.highlights)?e.highlights.length:0,hasDescription:!!e.description,hasWhy:!!e.why,computedActivitiesLength:d.length,computedDescription:T.substring(0,50)+"...",rawCity:e}),g.useEffect(()=>{if(!e.image&&!e.imageUrl&&l&&l!=="Unknown"){let c=!0;return oe(l,e.country).then(m=>{c&&(m?$(m):q(!0),j(!1))}),()=>{c=!1}}},[l,e.image,e.imageUrl,e.country]),n.jsxs(H.div,{initial:{opacity:0,scale:.95},animate:{opacity:1,scale:1},transition:{delay:t*.1},onClick:r,className:o.card,children:[n.jsx("div",{className:o.imageContainer,children:F?n.jsx("div",{className:o.imageLoading,style:{background:`linear-gradient(135deg, ${a}, ${a}dd)`},children:n.jsx("div",{className:o.spinner})}):h&&!M?n.jsx("img",{src:h,alt:l,className:o.image,onError:()=>q(!0)}):n.jsx("div",{className:o.imageFallback,style:{background:`linear-gradient(135deg, ${a}, ${a}dd)`},children:n.jsx(D,{className:"h-16 w-16",style:{color:"rgba(255, 255, 255, 0.5)"}})})}),n.jsxs("div",{className:o.content,children:[n.jsx("h4",{className:o.title,style:{color:a},children:l}),e.nights!==void 0&&n.jsxs("div",{className:o.durationBadge,children:[n.jsx(U,{className:"h-4 w-4",style:{color:a}}),n.jsxs("span",{className:o.durationText,children:[e.nights," ",e.nights===1?"night":"nights"]})]}),i&&s.length>0&&n.jsx("div",{className:o.themeBadges,children:s.map(c=>n.jsx("span",{className:o.themeBadge,style:{backgroundColor:ce[c]||"#6b7280"},children:le[c]||c},c))}),T&&n.jsx("p",{className:o.description,children:T}),d&&d.length>0&&n.jsxs("div",{children:[n.jsx("p",{className:o.highlightsLabel,children:"Highlights"}),n.jsx("ul",{className:o.highlightsList,children:d.filter(c=>c).slice(0,3).map((c,m)=>{const I=typeof c=="string"?c:c.name||c.activity||"Activity";return n.jsxs("li",{className:o.highlight,children:[n.jsx("div",{className:o.highlightBullet,style:{backgroundColor:a}}),n.jsx("span",{children:I})]},m)})})]})]})]})}L.__docgenInfo={description:"",methods:[],displayName:"CityCard",props:{city:{required:!0,tsType:{name:"City"},description:""},index:{required:!0,tsType:{name:"number"},description:""},themeColor:{required:!0,tsType:{name:"string"},description:""},showThemeBadges:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},themes:{required:!1,tsType:{name:"Array",elements:[{name:"string"}],raw:"string[]"},description:"",defaultValue:{value:"[]",computed:!1}},onClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""}}};const pe={title:"Components/CityCard",component:L,parameters:{layout:"centered",docs:{description:{component:"A card component displaying city information with image, activities, and theme-based styling. Used throughout the app to display route cities."}}},tags:["autodocs"],argTypes:{themeColor:{control:"color",description:"Theme color from agent type (adventure, culture, food, hidden-gems)"},showThemeBadges:{control:"boolean",description:"Whether to display theme badges (for Best Overall routes)"}},decorators:[e=>n.jsx("div",{style:{width:"400px",padding:"20px"},children:n.jsx(e,{})})]},u={args:{city:{name:"Barcelona",country:"Spain",nights:3,activities:["Sagrada Familia","Park Güell","Gothic Quarter","La Rambla","Barceloneta Beach"],image:"https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80",description:"Vibrant city with stunning architecture, beach culture, and world-class cuisine"},index:0,themeColor:"#a87600",showThemeBadges:!1,themes:[]}},p={args:{city:{name:"Chamonix",country:"France",nights:2,activities:["Mont Blanc Hiking","Paragliding","Glacier Tour","Ice Climbing"],image:"https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",description:"Alpine paradise for outdoor enthusiasts with breathtaking mountain views"},index:0,themeColor:"#055948",showThemeBadges:!1,themes:[]}},f={args:{city:{name:"Lyon",country:"France",nights:2,activities:["Bouchon Dining","Les Halles Market","Wine Tasting","Cooking Class"],image:"https://images.unsplash.com/photo-1524396309943-e03f5249f002?w=800&q=80",description:"Gastronomic capital of France with authentic cuisine and vibrant food markets"},index:0,themeColor:"#650411",showThemeBadges:!1,themes:[]}},w={args:{city:{name:"Ljubljana",country:"Slovenia",nights:2,activities:["Dragon Bridge","Tivoli Park","Castle Hill","Central Market"],image:"https://images.unsplash.com/photo-1554072675-66db59dba46f?w=800&q=80",description:"Charming European capital with medieval architecture and vibrant culture"},index:0,themeColor:"#081d5b",showThemeBadges:!1,themes:[]}},y={args:{city:{name:"Paris",country:"France",nights:4,activities:["Eiffel Tower","Louvre Museum","Montmartre","Seine River Cruise"],image:"https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",description:"City of Light - culture, romance, cuisine, and iconic landmarks"},index:0,themeColor:"#457B9D",showThemeBadges:!0,themes:["culture","food","hidden-gems"]}},b={args:{city:{name:"Rome",country:"Italy",nights:3,activities:["Colosseum","Vatican Museums","Trevi Fountain","Roman Forum"],description:"Eternal city with ancient ruins, Renaissance art, and incredible food"},index:0,themeColor:"#a87600",showThemeBadges:!1,themes:[]}},v={args:{city:{name:"Bruges",country:"Belgium",nights:2,activities:["Canal Tours","Belfry Tower","Chocolate Shops","Medieval Architecture"],description:"Medieval fairytale town with cobblestone streets and picturesque canals"},index:0,themeColor:"#055948",showThemeBadges:!1,themes:[]}},C={args:{city:{name:"Porto",country:"Portugal",nights:2,activities:["Ribeira District"],image:"https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=80",description:"Historic port city famous for its wine, bridges, and riverside charm"},index:0,themeColor:"#650411",showThemeBadges:!1,themes:[]}},B={args:{city:{name:"Vienna",country:"Austria",nights:3,activities:["Schönbrunn Palace","Opera House","Belvedere","Hofburg"],image:"https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800&q=80",description:"Imperial capital renowned for classical music, grand palaces, traditional coffee houses, and rich cultural heritage spanning centuries of Habsburg rule"},index:0,themeColor:"#a87600",showThemeBadges:!1,themes:[]}},x={args:{city:{name:"Salzburg",country:"Austria",nights:1,activities:["Hohensalzburg Fortress","Mozart Birthplace","Old Town"],image:"https://images.unsplash.com/photo-1598970434795-0c54fe7c0648?w=800&q=80",description:"Mozart's birthplace with baroque architecture and mountain backdrop"},index:0,themeColor:"#a87600",showThemeBadges:!1,themes:[]}},_={args:{city:{name:"Amsterdam",country:"Netherlands",nights:3,activities:["Anne Frank House","Canal Cruise","Van Gogh Museum","Jordaan District"],image:"https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80",description:"Canal-ringed city known for art, cycling culture, and historic charm"},index:0,themeColor:"#457B9D",showThemeBadges:!1,themes:[],onClick:()=>alert("City card clicked!")}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    city: {
      name: 'Barcelona',
      country: 'Spain',
      nights: 3,
      activities: ['Sagrada Familia', 'Park Güell', 'Gothic Quarter', 'La Rambla', 'Barceloneta Beach'],
      image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80',
      description: 'Vibrant city with stunning architecture, beach culture, and world-class cuisine'
    },
    index: 0,
    themeColor: '#a87600',
    showThemeBadges: false,
    themes: []
  }
}`,...u.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    city: {
      name: 'Chamonix',
      country: 'France',
      nights: 2,
      activities: ['Mont Blanc Hiking', 'Paragliding', 'Glacier Tour', 'Ice Climbing'],
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
      description: 'Alpine paradise for outdoor enthusiasts with breathtaking mountain views'
    },
    index: 0,
    themeColor: '#055948',
    showThemeBadges: false,
    themes: []
  }
}`,...p.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    city: {
      name: 'Lyon',
      country: 'France',
      nights: 2,
      activities: ['Bouchon Dining', 'Les Halles Market', 'Wine Tasting', 'Cooking Class'],
      image: 'https://images.unsplash.com/photo-1524396309943-e03f5249f002?w=800&q=80',
      description: 'Gastronomic capital of France with authentic cuisine and vibrant food markets'
    },
    index: 0,
    themeColor: '#650411',
    showThemeBadges: false,
    themes: []
  }
}`,...f.parameters?.docs?.source}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    city: {
      name: 'Ljubljana',
      country: 'Slovenia',
      nights: 2,
      activities: ['Dragon Bridge', 'Tivoli Park', 'Castle Hill', 'Central Market'],
      image: 'https://images.unsplash.com/photo-1554072675-66db59dba46f?w=800&q=80',
      description: 'Charming European capital with medieval architecture and vibrant culture'
    },
    index: 0,
    themeColor: '#081d5b',
    showThemeBadges: false,
    themes: []
  }
}`,...w.parameters?.docs?.source}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    city: {
      name: 'Paris',
      country: 'France',
      nights: 4,
      activities: ['Eiffel Tower', 'Louvre Museum', 'Montmartre', 'Seine River Cruise'],
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
      description: 'City of Light - culture, romance, cuisine, and iconic landmarks'
    },
    index: 0,
    themeColor: '#457B9D',
    showThemeBadges: true,
    themes: ['culture', 'food', 'hidden-gems']
  }
}`,...y.parameters?.docs?.source}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    city: {
      name: 'Rome',
      country: 'Italy',
      nights: 3,
      activities: ['Colosseum', 'Vatican Museums', 'Trevi Fountain', 'Roman Forum'],
      // No image to trigger loading state
      description: 'Eternal city with ancient ruins, Renaissance art, and incredible food'
    },
    index: 0,
    themeColor: '#a87600',
    showThemeBadges: false,
    themes: []
  }
}`,...b.parameters?.docs?.source}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    city: {
      name: 'Bruges',
      country: 'Belgium',
      nights: 2,
      activities: ['Canal Tours', 'Belfry Tower', 'Chocolate Shops', 'Medieval Architecture'],
      description: 'Medieval fairytale town with cobblestone streets and picturesque canals'
    },
    index: 0,
    themeColor: '#055948',
    showThemeBadges: false,
    themes: []
  }
}`,...v.parameters?.docs?.source}}};C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    city: {
      name: 'Porto',
      country: 'Portugal',
      nights: 2,
      activities: ['Ribeira District'],
      image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=80',
      description: 'Historic port city famous for its wine, bridges, and riverside charm'
    },
    index: 0,
    themeColor: '#650411',
    showThemeBadges: false,
    themes: []
  }
}`,...C.parameters?.docs?.source}}};B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  args: {
    city: {
      name: 'Vienna',
      country: 'Austria',
      nights: 3,
      activities: ['Schönbrunn Palace', 'Opera House', 'Belvedere', 'Hofburg'],
      image: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800&q=80',
      description: 'Imperial capital renowned for classical music, grand palaces, traditional coffee houses, and rich cultural heritage spanning centuries of Habsburg rule'
    },
    index: 0,
    themeColor: '#a87600',
    showThemeBadges: false,
    themes: []
  }
}`,...B.parameters?.docs?.source}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    city: {
      name: 'Salzburg',
      country: 'Austria',
      nights: 1,
      activities: ['Hohensalzburg Fortress', 'Mozart Birthplace', 'Old Town'],
      image: 'https://images.unsplash.com/photo-1598970434795-0c54fe7c0648?w=800&q=80',
      description: 'Mozart\\'s birthplace with baroque architecture and mountain backdrop'
    },
    index: 0,
    themeColor: '#a87600',
    showThemeBadges: false,
    themes: []
  }
}`,...x.parameters?.docs?.source}}};_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    city: {
      name: 'Amsterdam',
      country: 'Netherlands',
      nights: 3,
      activities: ['Anne Frank House', 'Canal Cruise', 'Van Gogh Museum', 'Jordaan District'],
      image: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80',
      description: 'Canal-ringed city known for art, cycling culture, and historic charm'
    },
    index: 0,
    themeColor: '#457B9D',
    showThemeBadges: false,
    themes: [],
    onClick: () => alert('City card clicked!')
  }
}`,..._.parameters?.docs?.source}}};const fe=["Default","Adventure","Food","HiddenGems","WithThemeBadges","Loading","WithoutImage","MinimalActivities","LongDescription","SingleNight","Interactive"];export{p as Adventure,u as Default,f as Food,w as HiddenGems,_ as Interactive,b as Loading,B as LongDescription,C as MinimalActivities,x as SingleNight,y as WithThemeBadges,v as WithoutImage,fe as __namedExportsOrder,pe as default};

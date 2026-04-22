export { renderers } from '../../renderers.mjs';

const prerender = false;
const GET = async () => {
  try {
    const apiUrl = "https://agent-react-portfolio.onrender.com/chat";
    fetch(apiUrl).catch(() => {
    });
    return new Response(JSON.stringify({ status: "waking up Render..." }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error" }), { status: 500 });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };

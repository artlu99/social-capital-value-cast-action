import { Hono } from 'hono'
const app = new Hono()

app.get('/', (c) => c.text('Social Capital Value Cast Action by @artlu'))

export default app
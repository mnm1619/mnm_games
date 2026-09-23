export default {
  async fetch(request, env) {
    const target = new URL(env.APPS_SCRIPT_URL)
    target.search = new URL(request.url).search

    const headers = new Headers(request.headers)
    headers.delete('host')
    const body = request.method === 'GET' || request.method === 'HEAD'
      ? undefined
      : await request.arrayBuffer()

    let response = await fetch(target, {
      method: request.method,
      headers,
      body,
      redirect: 'manual',
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (location) {
        response = await fetch(new URL(location, target), {
          method: request.method,
          headers,
          body,
          redirect: 'follow',
        })
      }
    }

    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    })
  },
}
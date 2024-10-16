test('has healtcheck routes', () => {
  const routes = [
    { path: '/', method: 'get' },
    { path: '/docker', method: 'get' },
    { path: '/ecs', method: 'get' },
    { path: '/alb', method: 'get' },
    { path: '/nlb', method: 'get' },
  ]

it.each(routes)('`$method` exists on $path', (route) => {
  expect(router.stack.some((s) => Object.keys(s.route.methods).includes(route.method))).toBe(true)
  expect(router.stack.some((s) => s.route.path === route.path)).toBe(true)
})

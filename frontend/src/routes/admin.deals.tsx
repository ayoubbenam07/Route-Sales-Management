import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/deals')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/deals"!</div>
}

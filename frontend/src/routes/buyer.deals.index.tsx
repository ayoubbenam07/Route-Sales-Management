import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/buyer/deals/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/buyer/deals/"!</div>
}

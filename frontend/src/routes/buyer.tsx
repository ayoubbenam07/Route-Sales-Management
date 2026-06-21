import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/buyer')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/buyer"!</div>
}

import { useParams } from 'react-router-dom'
import Booking from './Booking'

export default function AgendarBarbeiro() {
  const { slug } = useParams()
  return <Booking preselectedSlug={slug} />
}

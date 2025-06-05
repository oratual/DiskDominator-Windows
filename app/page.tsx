import DiskDominatorV2 from "@/components/disk-dominator-v2"
import { ReadabilityProvider } from "@/components/readability-provider"

export default function Home() {
  return (
    <ReadabilityProvider>
      <DiskDominatorV2 />
    </ReadabilityProvider>
  )
}

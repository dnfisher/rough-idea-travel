import { DestinationDetailPage } from "./DestinationDetailPage";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <DestinationDetailPage slug={slug} />;
}

export function groupAssets(assets: any[]) {
  return assets.reduce((groups, asset) => {
    const key =
      asset.metadata?.period ||
      asset.metadata?.artist ||
      asset.tags?.[0] ||
      "Ungrouped";

    groups[key] ||= [];
    groups[key].push(asset);

    return groups;
  }, {} as Record<string, any[]>);
}
export type DomainType = {
  owner: string;
  name: string;
  parentId?: number;
  chainId: number;
  status: number;
  additionalPrice: number;
  createdAt: Date;
  finishedAt: Date;
};


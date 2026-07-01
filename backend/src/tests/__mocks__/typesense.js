const typesenseMock = {
  collections: jest.fn().mockReturnValue({
    documents: jest.fn().mockReturnValue({
      search:  jest.fn().mockResolvedValue({ hits: [], found: 0 }),
      upsert:  jest.fn().mockResolvedValue({}),
      delete:  jest.fn().mockResolvedValue({}),
      update:  jest.fn().mockResolvedValue({}),
      import:  jest.fn().mockResolvedValue([])
    }),
    retrieve: jest.fn().mockResolvedValue({}),
    create:   jest.fn().mockResolvedValue({})
  })
};

export default typesenseMock;

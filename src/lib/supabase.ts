export const supabase: any = {
  from: (table: string) => ({
    select: (query?: string) => ({
      order: (column: string, options: any) => Promise.resolve({ data: table === 'deals' ? [{ id: 'mock-1', project_address: '123 Mock St', status: 'draft', updated_at: new Date().toISOString(), deal_type: 'construction' }] : [], error: null }),
      eq: (column: string, value: any) => ({
        single: () => Promise.resolve({
            data: {
                id: value,
                project_address: '123 Mock St',
                deal_type: 'construction',
                interest_rate: 0.0999,
                laf_rate: 0.015,
                gst_method: 'standard',
                loan_term_months: 18,
                build_term_months: 12
            },
            error: null
        })
      })
    }),
    insert: (data: any) => ({
      select: () => ({
        single: () => Promise.resolve({ data: { id: 'mock-' + Math.floor(Math.random()*1000), ...data[0] }, error: null })
      })
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        select: () => ({
          single: () => Promise.resolve({ data: { id: value, ...data }, error: null })
        })
      })
    }),
    delete: () => ({ eq: () => Promise.resolve({ error: null }) })
  }),
  storage: {
    from: () => ({
      getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/mock.pdf' } })
    })
  }
};

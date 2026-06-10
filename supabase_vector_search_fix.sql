drop function if exists match_knowledge_base_v2(vector, integer);

create or replace function match_knowledge_base_v2(
  query_embedding vector(1536),
  match_count int default 5
)
returns table (
  id uuid,
  source_type text,
  source_name text,
  content text,
  similarity float
)
language sql
stable
as $$
  select
    k.id,
    k.source_type,
    k.source_name,
    k.content,
    1 - (k.embedding <=> query_embedding) as similarity
  from knowledge_base_embeddings k
  where k.embedding is not null
  order by k.embedding <=> query_embedding
  limit match_count;
$$;

grant execute on function match_knowledge_base_v2(vector, integer) to anon;
grant execute on function match_knowledge_base_v2(vector, integer) to authenticated;

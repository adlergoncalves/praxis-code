namespace Orders.Application;

public sealed record CreateOrderRequest(Guid CustomerId, IReadOnlyList<Guid> ProductIds);

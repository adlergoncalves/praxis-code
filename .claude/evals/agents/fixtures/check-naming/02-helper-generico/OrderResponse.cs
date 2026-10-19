namespace Orders.Application;

public sealed record OrderResponse(Guid OrderId, decimal Total);

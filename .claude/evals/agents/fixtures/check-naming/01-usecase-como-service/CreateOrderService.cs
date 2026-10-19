namespace Orders.Application;

public sealed class CreateOrderService : IUseCase<CreateOrderRequest, OrderResponse>
{
    private readonly IOrderRepository _orderRepository;

    public CreateOrderService(IOrderRepository orderRepository)
    {
        _orderRepository = orderRepository;
    }

    public async Task<OrderResponse> ExecuteAsync(CreateOrderRequest request, CancellationToken cancellationToken)
    {
        var order = Order.Create(request.CustomerId, request.ProductIds);
        await _orderRepository.AddAsync(order, cancellationToken);
        return new OrderResponse(order.Id, order.Total);
    }
}

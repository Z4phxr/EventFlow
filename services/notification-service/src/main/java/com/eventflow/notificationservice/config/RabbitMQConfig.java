package com.eventflow.notificationservice.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE = "eventflow.exchange";
    public static final String QUEUE = "notification.queue";
    
    // Routing keys patterns for topic exchange
    public static final String EVENT_PATTERN = "event.*";
    public static final String REGISTRATION_PATTERN = "registration.*";

    @Bean
    public TopicExchange eventFlowExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    public Queue notificationQueue() {
        return new Queue(QUEUE, true);
    }

    @Bean
    public Binding bindingEventCreated(Queue notificationQueue, TopicExchange eventFlowExchange) {
        return BindingBuilder.bind(notificationQueue)
                .to(eventFlowExchange)
                .with("event.created");
    }

    @Bean
    public Binding bindingEventUpdated(Queue notificationQueue, TopicExchange eventFlowExchange) {
        return BindingBuilder.bind(notificationQueue)
                .to(eventFlowExchange)
                .with("event.updated");
    }

    @Bean
    public Binding bindingEventDeleted(Queue notificationQueue, TopicExchange eventFlowExchange) {
        return BindingBuilder.bind(notificationQueue)
                .to(eventFlowExchange)
                .with("event.deleted");
    }

    @Bean
    public Binding bindingRegistrationCreated(Queue notificationQueue, TopicExchange eventFlowExchange) {
        return BindingBuilder.bind(notificationQueue)
                .to(eventFlowExchange)
                .with("registration.created");
    }

    @Bean
    public Binding bindingRegistrationDeleted(Queue notificationQueue, TopicExchange eventFlowExchange) {
        return BindingBuilder.bind(notificationQueue)
                .to(eventFlowExchange)
                .with("registration.deleted");
    }

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        return mapper;
    }

    @Bean
    public MessageConverter jsonMessageConverter(ObjectMapper objectMapper) {
        return new Jackson2JsonMessageConverter(objectMapper);
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, 
                                        MessageConverter messageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter);
        return template;
    }
}

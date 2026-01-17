package com.eventflow.eventservice.common.config;

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
    
    public static final String EVENT_CREATED_KEY = "event.created";
    public static final String EVENT_UPDATED_KEY = "event.updated";
    public static final String EVENT_DELETED_KEY = "event.deleted";
    public static final String REGISTRATION_CREATED_KEY = "registration.created";
    public static final String REGISTRATION_DELETED_KEY = "registration.deleted";
    public static final String INVITATION_REQUESTED_KEY = "invitation.requested";

    @Bean
    public TopicExchange eventFlowExchange() {
        return new TopicExchange(EXCHANGE, true, false);
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
